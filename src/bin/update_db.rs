#[macro_use]
extern crate log;
use isahc::config::RedirectPolicy;
use isahc::prelude::*;
use rayon::prelude::*;
use renderdiff::{
    db::{get_previous_items, insert_diff_records_and_update_previous, insert_records_first_seen},
    Link, LinkContent, LinkRef, VoxRecord,
};
use retry::delay::jitter;
use retry::delay::Exponential;
use retry::retry;
use select::{
    document::Document,
    predicate::{Attr, Class, Name},
};
use simplelog::*;
use std::collections::{HashMap, HashSet};
type DiffError = Box<dyn std::error::Error>;
const VOX: &str = "https://www.vox.com";
fn get_content_for_one(addr: &str) -> Result<String, DiffError> {
    let mut response = retry(Exponential::from_millis(5000).map(jitter).take(5), || {
        Request::get(addr)
            .redirect_policy(RedirectPolicy::Follow)
            .body(())?
            .send()
    })
    .unwrap();
    let resp = response.text()?;
    let document = Document::from(resp.as_ref());
    let content: String = document
        .find(Class("c-entry-content"))
        .map(|v| v.html())
        .collect::<Vec<String>>()
        .join("\n");
    Ok(content)
}
type ContentRef<'a> = &'a str;
type Revision = u32;
fn main() -> Result<(), DiffError> {
    TermLogger::init(LevelFilter::Info, Config::default(), TerminalMode::Mixed).unwrap();
    // Load preexisting data
    let previous_data: Vec<VoxRecord> = get_previous_items();
    let previous_links: HashMap<LinkRef, (ContentRef, Revision)> = previous_data
        .iter()
        .map(|i| (i.url.as_ref(), (i.content.as_ref(), i.revision)))
        .collect();
    info!(
        "Found {} pre-existing articles in the last 3 days",
        previous_data.len()
    );
    // Scrape main page and get links

    let scraped_links: HashSet<Link> = {
        let vox = isahc::get(VOX)?.text()?;
        let document = Document::from(vox.as_ref());
        let articles = document.find(Attr("data-analytics-link", "article"));
        let features = document.find(Attr("data-analytics-link", "feature"));
        articles
            .chain(features)
            .map(|c| c.attr("href").unwrap().to_owned())
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
    let records: Vec<LinkContent> = links_to_query
        .par_iter()
        .map(|item| {
            (item.to_string(), {
                let content = get_content_for_one(item).unwrap();
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
    let content_first_time_seen: Vec<&LinkContent> = records
        .iter()
        .filter(|e| !previous_links.contains_key(e.0.as_ref() as &str))
        .collect();
    info!(
        "Inserting {} novel records in db",
        &content_first_time_seen.len()
    );
    insert_records_first_seen(&content_first_time_seen);
    // 2.1 Responses in the previous set, content is the same -> Nothing
    // 2.2 Responses in the previous set, content it different  -> revision:prev+1,latest: true. Insert
    let different_content: Vec<VoxRecord> = records
        .into_iter()
        .filter(|e| previous_links.contains_key(e.0.as_ref() as &str))
        .filter(|e| e.1 != previous_links.get(e.0.as_ref() as &str).unwrap().0)
        .map(|lc| VoxRecord {
            url: lc.0.clone(),
            content: lc.1,
            revision: previous_links.get(lc.0.as_ref() as &str).unwrap().1 + 1,
        })
        .collect();
    // With 2.2, generate db entries.
    info!("Inserting {} diffed records", different_content.len());
    insert_diff_records_and_update_previous(&different_content);

    info!("Done!");
    Ok(())
}
