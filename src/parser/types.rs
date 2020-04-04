use regex::Regex;
use scraper::Selector;
use serde::{Deserialize, Serialize};
use url::Url;
#[derive(Deserialize, Debug, Serialize)]
pub struct SerializableScrapingCondition {
    pub base_url: String,
    pub links: SerializableLinkScrapingCondition,
    pub content: SerializableContentScrapingCondition,
}
impl Into<ScrapingCondition> for SerializableScrapingCondition {
    fn into(self) -> ScrapingCondition {
        ScrapingCondition {
            base_url: Url::parse(&self.base_url).unwrap(),
            links: self.links.into(),
            content: self.content.into(),
        }
    }
}
#[derive(Deserialize, Debug, Serialize)]
pub struct SerializableLinkScrapingCondition {
    pub selector: String,
    pub href_regex: String,
    pub href_regex_exclude: Option<String>,
}
impl Into<LinkScrapingCondition> for SerializableLinkScrapingCondition {
    fn into(self) -> LinkScrapingCondition {
        LinkScrapingCondition {
            selector: Selector::parse(&self.selector).unwrap(),
            href_regex: Regex::new(&self.href_regex).unwrap(),
            href_regex_exclude: self.href_regex_exclude.map(|s| Regex::new(&s).unwrap()),
        }
    }
}
#[derive(Deserialize, Debug, Serialize)]
pub struct SerializableContentScrapingCondition {
    pub selectors: Vec<String>,
}
impl Into<ContentScrapingCondition> for SerializableContentScrapingCondition {
    fn into(self) -> ContentScrapingCondition {
        ContentScrapingCondition {
            selectors: self
                .selectors
                .iter()
                .map(|s| Selector::parse(&s).unwrap())
                .collect(),
        }
    }
}
pub struct ScrapingCondition {
    pub base_url: Url,
    pub links: LinkScrapingCondition,
    pub content: ContentScrapingCondition,
}
pub struct LinkScrapingCondition {
    // A css selector that yields the position of all the hrefs
    pub selector: Selector,
    // A regex to apply to the link
    pub href_regex: Regex,
    // Don't take these
    pub href_regex_exclude: Option<Regex>,
}
impl LinkScrapingCondition {
    pub fn is_match(&self, text: &str) -> bool {
        self.href_regex.is_match(text)
            & !self
                .href_regex_exclude
                .as_ref()
                .map(|x| x.is_match(text))
                .unwrap_or(false)
    }
}

pub struct ContentScrapingCondition {
    pub selectors: Vec<Selector>,
}
