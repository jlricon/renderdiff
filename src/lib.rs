pub mod db;
extern crate openssl;
#[macro_use]
extern crate diesel;
#[macro_use]
extern crate log;
use diff::strings_are_dif_equal;
pub mod parser;
use db::{
    establish_connection, get_previous_items, insert_diff_records_and_update_previous,
    insert_records_first_seen,
};
use isahc::{config::RedirectPolicy, prelude::*};
use parser::Target;
use rayon::prelude::*;
use retry::{
    delay::{jitter, Exponential},
    retry,
};
use select::{
    document::Document,
    predicate::{Attr, Class, Name},
};
use serde::Deserialize;
use std::collections::{HashMap, HashSet};
pub type Link = String;
pub type LinkRef<'a> = &'a str;
type Content = String;
pub type LinkContent = (Link, Content);
pub type LinkContentRef<'a> = (&'a str, &'a str);
pub struct VoxRecord {
    pub url: String,
    pub content: String,
    pub revision: u32,
}
pub struct RefVoxRecord<'a> {
    pub url: &'a str,
    pub content: &'a str,
    pub revision: u32,
}
#[derive(Deserialize, Clone, Debug)]
pub struct Event {
    url: String,
}

pub type DiffError = Box<dyn std::error::Error>;
type ContentRef<'a> = &'a str;
type Revision = u32;
#[cfg(test)]
use mockito;
fn request_with_retry_and_redirect(
    _addr: &str,
    client: &HttpClient,
) -> Result<String, retry::Error<std::io::Error>> {
    #[cfg(test)]
    let _addr = &mockito::server_url();
    retry(Exponential::from_millis(10000).map(jitter).take(10), || {
        let req = Request::get(_addr)
            .redirect_policy(RedirectPolicy::Follow)
            .body(())
            .unwrap();
        let mut resp = client.send(req).map_err(|e| {
            error!("{}", e);
            e
        })?;
        resp.text()
    })
}
fn get_string_from_doc<T: select::predicate::Predicate>(
    document: &Document,
    predicate: T,
) -> String {
    document
        .find(predicate)
        .map(|v| v.html())
        .collect::<Vec<String>>()
        .join("\n")
}
fn get_content_for_one(
    addr: &str,
    client: &HttpClient,
    content_targets: &Vec<Target>,
) -> Result<String, DiffError> {
    let resp = request_with_retry_and_redirect(addr, client).unwrap();
    let document = Document::from(resp.as_ref());
    let content: String = content_targets
        .iter()
        .map(|t| match t {
            Target::Class { name } => get_string_from_doc(&document, Class(name.as_ref())),
            Target::Attr { name, value } => {
                get_string_from_doc(&document, Attr(name.as_ref(), value.as_ref()))
            } // Target::Name { name } => get_string_from_doc(&document, Name(name.as_ref())),
        })
        .collect::<Vec<String>>()
        .join(" ");

    Ok(content)
}

pub fn push_vox_into_db(event: parser::Request, dry_run: bool) -> Result<(), DiffError> {
    let conn = establish_connection();
    // Load preexisting data
    info!("Loading from db");
    let previous_data: Vec<VoxRecord> = get_previous_items(&conn, &event.base_url);
    let previous_links: HashMap<LinkRef, (ContentRef, Revision)> = previous_data
        .iter()
        .map(|i| (i.url.as_ref(), (i.content.as_ref(), i.revision)))
        .collect();
    info!(
        "Found {} pre-existing articles in the last 3 days",
        previous_data.len()
    );
    let client = HttpClient::new()?;
    // Scrape main page and get links
    info!("Scraping(request+parsing html)");
    let scraped_links: HashSet<Link> = {
        let base = request_with_retry_and_redirect(&event.base_url, &client)?;
        let document = Document::from(base.as_ref());
        event
            .link_targets
            .iter()
            .map(|l| match l {
                Target::Class { name } => document
                    .find(Class(name.as_ref()))
                    .map(|c| c.attr("href").unwrap().to_owned())
                    .collect::<Vec<Link>>(),
                Target::Attr { name, value } => document
                    .find(Attr(name.as_ref(), value.as_ref()))
                    .map(|c| c.attr("href").unwrap().to_owned())
                    .collect(),
            })
            .flatten()
            .collect()
    };

    info!("{} links scraped", &scraped_links.len());
    // Merge both sets of urls
    let links_to_query: HashSet<LinkRef> = previous_links
        .iter()
        .map(|o| *o.0)
        .chain(scraped_links.iter().map(|i| i.as_ref()))
        .collect();
    // Request the links
    info!("Requesting links");
    let records: Vec<LinkContent> = links_to_query
        .par_iter()
        .map(|item| {
            (item.to_string(), {
                let content = get_content_for_one(item, &client, &event.content_targets).unwrap();
                let articles = Document::from(content.as_ref());
                articles
                    .find(Name("p"))
                    .map(|n| n.inner_html())
                    .collect::<Vec<String>>()
                    .join(" ")
            })
        })
        .map(|(link, content)| {
            if content.trim().is_empty() {
                panic!("A url was empty: {}", &link);
            }
            (link, content)
        })
        .collect();
    // Out of all the responses
    // 1. Responses not in the previous set -> Form DB entries, insert.
    let content_first_time_seen: Vec<LinkContentRef> = records
        .iter()
        .map(|(a, b)| (a.as_ref(), b.as_ref()))
        .filter(|e: &LinkContentRef| !previous_links.contains_key(e.0.as_ref() as &str))
        .collect();

    if dry_run {
        info!(
            "Skipping record insertion of {} novel records",
            content_first_time_seen.len()
        );
        debug!("{:?}", &content_first_time_seen);
    } else {
        info!(
            "Inserting {} novel records in db",
            &content_first_time_seen.len()
        );
        insert_records_first_seen(content_first_time_seen, &conn, &event.base_url);
        info!("Insertion done");
    }
    // 2.1 Responses in the previous set, content is the same -> Nothing
    // 2.2 Responses in the previous set, content it different  -> revision:prev+1,latest: true. Insert
    info!("Diffing starts");
    let different_content: Vec<RefVoxRecord> = records
        .iter()
        .filter(|e| previous_links.contains_key(e.0.as_ref() as &str))
        .filter(|e| {
            !strings_are_dif_equal(&e.1, previous_links.get(e.0.as_ref() as &str).unwrap().0)
        })
        .map(|lc| RefVoxRecord {
            url: &lc.0,
            content: &lc.1,
            revision: previous_links.get(lc.0.as_ref() as &str).unwrap().1 + 1,
        })
        .collect();
    // With 2.2, generate db entries.
    if dry_run {
        info!(
            "Skipping insertion of {} diffed records",
            different_content.len()
        );
    } else {
        info!("Inserting {} diffed records", different_content.len());
        insert_diff_records_and_update_previous(&different_content, &conn, &event.base_url);
    }

    info!("Done!");
    Ok(())
}

#[cfg(test)]
mod test {
    use super::*;
    use mockito::mock;
    #[test]
    fn test_get_content_for_one() {
        let _m = mock("GET", mockito::Matcher::Any)
            .with_body(r#"<div class="c-entry-content"><p>test</p></div>"#)
            .create();
        let client = HttpClient::new().unwrap();
        let addr = "https://www.test.com/test";
        let content_targets = vec![Target::Class {
            name: "c-entry-content".to_owned(),
        }];
        let res = get_content_for_one(addr, &client, &content_targets).unwrap();
        let articles = Document::from(res.as_ref());
        println!("{}", &res);
        let res2 = articles
            .find(Name("p"))
            .map(|n| n.inner_html())
            .collect::<Vec<String>>()
            .join(" ");
        assert_eq!(res2, "test");
    }
    #[test]
    fn test_scrape_works() {
        let base = r#"<a href="https://www.vox.com/authors/brian-resnick" data-analytics-link="article"></a>"#;
        let document = Document::from(base.as_ref());
        let link_targets = vec![
            Target::Attr {
                name: "data-analytics-link".to_owned(),
                value: "article".to_owned(),
            },
            Target::Attr {
                name: "data-analytics-link".to_owned(),
                value: "feature".to_owned(),
            },
        ];
        let res: HashSet<Link> = link_targets
            .iter()
            .map(|l| match l {
                Target::Class { name } => document
                    .find(Class(name.as_ref()))
                    .map(|c| c.attr("href").unwrap().to_owned())
                    .collect::<Vec<Link>>(),
                Target::Attr { name, value } => document
                    .find(Attr(name.as_ref(), value.as_ref()))
                    .map(|c| c.attr("href").unwrap().to_owned())
                    .collect(),
            })
            .flatten()
            .collect();
        let one = res.iter().nth(0).unwrap();
        assert_eq!(one, "https://www.vox.com/authors/brian-resnick");
    }
    #[test]
    fn test_retry_works() {
        let mut bla = 0;
        fn failfun(bla: &mut i32) -> Result<(), std::io::Error> {
            *bla += 1;
            Err(std::io::Error::new(std::io::ErrorKind::Other, "oh no"))
        }
        let _ret = retry(Exponential::from_millis(1).map(jitter).take(5), || {
            failfun(&mut bla)
        });
        assert_eq!(bla, 6)
    }
}
