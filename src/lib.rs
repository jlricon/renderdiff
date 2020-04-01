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
// TODO: Make unwraps more robust, check isahc codes
fn get_content_for_one(
    addr: &str,
    client: &HttpClient,
    content_targets: &Vec<Target>,
) -> Result<String, DiffError> {
    let mut response = retry(Exponential::from_millis(5000).map(jitter).take(5), || {
        let req = Request::get(addr)
            .redirect_policy(RedirectPolicy::Follow)
            .body(())
            .unwrap();
        client.send(req).map_err(|e| {
            error!("{}", e);
            e
        })
    })
    .unwrap();
    let resp = response.text()?;
    let document = Document::from(resp.as_ref());
    let content: String = content_targets
        .iter()
        .map(|t| match t {
            Target::Class { name } => document
                .find(Class(name.as_ref()))
                .map(|v| v.html())
                .collect::<Vec<String>>()
                .join("\n"),
            Target::Attr { name, value } => document
                .find(Attr(name.as_ref(), value.as_ref()))
                .map(|v| v.html())
                .collect::<Vec<String>>()
                .join("\n"),
        })
        .collect::<Vec<String>>()
        .join(" ");

    Ok(content)
}

pub fn push_vox_into_db(event: parser::Request) -> Result<(), DiffError> {
    // TermLogger::init(LevelFilter::Info, Config::default(), TerminalMode::Mixed).unwrap();
    let conn = establish_connection();
    // Load preexisting data
    info!("Loading from db");
    let previous_data: Vec<VoxRecord> = get_previous_items(&conn);
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
    info!("Scraping(rerquest+parsing html)");
    let scraped_links: HashSet<Link> = {
        let base = client.get(&event.base_url)?.text()?;
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
            if content.is_empty() {
                warn!("A url was empty: {}", &link);
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
    info!(
        "Inserting {} novel records in db",
        &content_first_time_seen.len()
    );
    insert_records_first_seen(content_first_time_seen, &conn);
    info!("Insertion done");
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
    info!("Inserting {} diffed records", different_content.len());
    insert_diff_records_and_update_previous(&different_content, &conn);
    info!("Done!");
    Ok(())
}
