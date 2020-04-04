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
use rayon::prelude::*;
use retry::{
    delay::{jitter, Exponential},
    retry,
};

use serde::Deserialize;
use std::collections::{HashMap, HashSet};
use url::Url;
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
    _addr: &Url,
    client: &HttpClient,
) -> Result<String, retry::Error<std::io::Error>> {
    #[cfg(test)]
    let _addr = &mockito::server_url();
    retry(Exponential::from_millis(1000).map(jitter).take(5), || {
        let req = Request::get(_addr.to_string())
            .redirect_policy(RedirectPolicy::Follow)
            .body(())
            .unwrap();
        let mut response = client.send(req).unwrap();
        // Validate response
        let text = response.text().unwrap();
        if text.len() < 20 {
            warn!("{}", &text);
        }

        if text == "Slow down\n" {
            Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                "We were told to slow down :(",
            ))
        } else {
            Ok(text)
        }
    })
}

fn get_content_for_one(
    addr: &str,
    client: &HttpClient,
    content_targets: &parser::types::ContentScrapingCondition,
) -> Result<String, DiffError> {
    let resp = request_with_retry_and_redirect(&Url::parse(addr)?, client).unwrap();
    // Validate response
    let parsed = parser::scrape_inner(&resp, content_targets);
    if parsed.is_none() {
        panic!("Failed to parse {}", addr);
    }
    Ok(parsed.unwrap())
}

pub fn push_vox_into_db(
    event: parser::types::ScrapingCondition,
    dry_run: bool,
) -> Result<(), DiffError> {
    let conn = establish_connection();
    let base_url = &event.base_url;
    // Load preexisting data
    info!("Loading from db");
    let previous_data: Vec<VoxRecord> = get_previous_items(&conn, base_url);
    let previous_links: HashMap<LinkRef, (ContentRef, Revision)> = previous_data
        .iter()
        .map(|i| (i.url.as_ref(), (i.content.as_ref(), i.revision)))
        .collect();
    info!(
        "Found {} pre-existing articles in the last 90 days",
        previous_data.len()
    );
    let client = HttpClient::new()?;
    // Scrape main page and get links
    info!("Scraping(request+parsing html)");
    let scraped_links: HashSet<Link> = {
        let base = request_with_retry_and_redirect(base_url, &client)?;
        parser::scrape_links(&base, &event.links, base_url).unwrap()
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
                get_content_for_one(item, &client, &event.content).unwrap()
                // Maybe trim to the <p> here?
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
        insert_records_first_seen(content_first_time_seen, &conn, &base_url);
        info!("Insertion done");
    }
    // 2.1 Responses in the previous set, content is the same -> Nothing
    // 2.2 Responses in the previous set, content it different  -> revision:prev+1,latest: true. Insert
    info!("Diffing starts");
    let different_content: Vec<RefVoxRecord> = records
        .par_iter()
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
        insert_diff_records_and_update_previous(&different_content, &conn, &base_url);
    }

    info!("Done!");
    Ok(())
}

#[cfg(test)]
mod test {
    use super::*;

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
/// This fixes a relative link to a potential URL
pub fn fix_malformed_url(x: &str, base_url: &Url) -> String {
    // Links that have fragments can be treated as the same link, as they don't affect checking
    base_url.join(x).unwrap().to_string()
}
#[test]
fn test_fix_malformed_url() {
    let base_url = Url::parse("https://test.com/").unwrap();
    assert_eq!(
        fix_malformed_url("http://test.com", &base_url),
        "http://test.com/".to_owned()
    );
    assert_eq!(
        fix_malformed_url("//test2.com", &base_url),
        "https://test2.com/".to_owned()
    );
    assert_eq!(
        fix_malformed_url("/subsite", &base_url),
        "https://test.com/subsite".to_owned()
    );
}
