use scraper::Html;

use std::collections::HashSet;
use url::Url;
pub mod types;
pub fn fix_malformed_url(link: &str, base_url: &Url) -> Url {
    // Links that have fragments can be treated as the same link, as they don't affect checking
    let mut res = base_url.join(link).unwrap();
    res.set_fragment(None);
    res
}

///This returns the concatenated content we find using the given selector
pub fn scrape_inner(html: &str, condition: &types::ContentScrapingCondition) -> Option<String> {
    if condition.selectors.is_empty() {
        return None;
    }
    let document = Html::parse_fragment(html);
    let mut res: String = "".to_owned();
    document.select(&condition.selectors[0]).for_each(|e| {
        e.text().for_each(|m| res += &m);
        // EOL
        res += "\n";
    });

    if res.is_empty() && condition.selectors.len() > 1 {
        scrape_inner(
            html,
            &types::ContentScrapingCondition {
                selectors: condition.selectors[1..].to_vec(),
            },
        )
    } else if res.is_empty() {
        None
    } else {
        Some(res)
    }
}

/// This returns a list of links found using the given selector
pub fn scrape_links(
    html: &str,
    condition: &types::LinkScrapingCondition,
    base_url: &Url,
) -> Option<HashSet<String>> {
    let document = Html::parse_document(html);
    let res = document
        .select(&condition.selector)
        .map(|e| e.value().attr("href"))
        .filter_map(|e| match e {
            // If the url is not in the relevant domain, skip it
            Some(a) => {
                let fixed_url = fix_malformed_url(a, base_url);
                let fixed_url_matches_regex = condition.is_match(&fixed_url.to_string());
                if fixed_url.host_str() == base_url.host_str() && fixed_url_matches_regex {
                    Some(fixed_url.to_string())
                } else {
                    None
                }
            }
            None => None,
        })
        .collect::<HashSet<String>>();

    if res.is_empty() {
        None
    } else {
        Some(res)
    }
}
#[cfg(test)]
mod test {
    use super::*;
    use scraper::Selector;
    #[test]
    fn test_scrape_inner() {
        let test = r#"<div>This is a test<p>This tho</p></div>"#;
        let condition = types::ContentScrapingCondition {
            selectors: vec![Selector::parse("div > p").unwrap()],
        };
        let parsed = scrape_inner(test, &condition).unwrap();
        assert_eq!("This tho\n", parsed);
    }
}

// BBC
// fn bla() {
//     let ba = ScrapingCondition {
//         base_url: "https://www.bbc.co.uk/news",
//         links: LinkScrapingCondition::new(r#"a.nw-o-link-split__anchor"#, "/news", "/live"),
//         content: ContentScrapingCondition {
//             selectors: vec![
//                 Selector::parse("div.story-body").unwrap(),
//                 Selector::parse("div.vxp-media__body").unwrap(),
//                 Selector::parse("div.Theme-Layer-BodyText").unwrap(),
//             ],
//         },
//     };
// }
