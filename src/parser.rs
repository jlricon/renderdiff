use serde::{Deserialize, Serialize};
#[derive(Deserialize, Debug, Serialize)]
pub enum Target {
    Class { name: String },
    Attr { name: String, value: String },
    // Like <p>
    // Name { name: String },
}

#[derive(Deserialize, Debug, Serialize)]
pub struct Request {
    // We first make a request to this
    pub base_url: String,
    // Then we get the links that result from these
    pub link_targets: Vec<Target>,
    // Then from those links we get the content from here
    pub content_targets: Vec<Target>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;
    #[test]
    fn test_json_gets_parsed() {
        let example = r#"{"base_url": "www.vox.com",
         "link_targets": [{"Class":{"name":"blah"}},{"Attr":{"name":"blah","value":"blop"}}],
          "content_targets":[]}"#;
        let _v: Request = serde_json::from_str(example).unwrap();
    }
    #[test]
    fn test_structs_get_jsonified() {
        let example = Request {
            base_url: "http://www.vox.com".to_owned(),
            link_targets: vec![
                Target::Attr {
                    name: "data-analytics-link".to_owned(),
                    value: "article".to_owned(),
                },
                Target::Attr {
                    name: "data-analytics-link".to_owned(),
                    value: "feature".to_owned(),
                },
            ],
            content_targets: vec![Target::Class {
                name: "c-entry-content".to_owned(),
            }],
        };
        let v = serde_json::to_string(&example).unwrap();
        println!("{}", &v);
        assert_eq!(
            v,
            r#"{"base_url":"http://www.vox.com",
            "link_targets":[{"Attr":{"name":"data-analytics-link","value":"article"}},
                            {"Attr":{"name":"data-analytics-link","value":"feature"}}],
            "content_targets":[{"Class":{"name":"c-entry-content"}}]}"#
                .replace("\n", "")
                .replace(" ", "")
        );
    }
}
