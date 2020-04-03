use select;
use select::predicate;
use serde::{Deserialize, Serialize};
/// Target is a HTML node we can get
#[derive(Deserialize, Debug, Serialize)]
pub enum Target {
    Class { name: String },
    Attr { name: String, value: String },
    // Like <p>
    // Name { name: String },
}
fn get_string_from_doc<T: select::predicate::Predicate>(
    document: &select::document::Document,
    predicate: T,
) -> Vec<String> {
    document
        .find(predicate)
        .map(|v| v.html())
        .collect::<Vec<String>>()
}
fn get_link_from_doc<T: select::predicate::Predicate>(
    document: &select::document::Document,
    predicate: T,
) -> Vec<String> {
    document
        .find(predicate)
        .map(|c| c.attr("href").unwrap().to_owned())
        .collect::<Vec<String>>()
}
#[derive(Deserialize, Debug, Serialize)]
pub enum Action {
    FetchLinks,
    GetContent(Vec<Target>),
}
// impl Action {
//     fn act(&self, document: &select::document::Document) -> Vec<String> {
//         match self {
//             Action::FetchLinks => get_link_from_doc(document, predicate::Attr("href", ())),
//             Action::GetContent(vector_of_targets) =>{
//                 let mut p:Box<dyn predicate::Predicate> =Box::new(predicate::Any);
//                 for v in vector_of_targets{
//                     match v{
//                         Target::Class { name } => p=Box::new(predicate::Or(p,predicate::Class(name.as_ref()))),
//                         // Target::Attr { name, value } =>
//                         //     p.or(predicate::Attr(name.as_ref(), value.as_ref()))
//                     };
//                 };
//                 vec![] }

// vec
//     .iter()
//     .map(|t| match t {
// Target::Class { name } => Box::new(predicate::Class(name.as_ref())),
// Target::Attr { name, value } => {
//     Box::new(predicate::Attr(name.as_ref(), value.as_ref()))
//         }
//     })
//     .flatten()
//     .collect(),
// }
// }

// Action::GetContent(Target::Class { name }) => {
//     get_string_from_doc(document, predicate::Class(name.as_ref()))
// }
// Action::GetContent(Target::Attr { name, value }) => {
//     get_string_from_doc(document, predicate::Attr(name.as_ref(), value.as_ref()))
// }
// }

#[derive(Deserialize, Debug, Serialize)]
pub struct Operation {
    action: Action,
    url: String,
    next: Option<Box<Operation>>,
}
fn operate() {
    use isahc::prelude::*;
    use select::document::Document;
    let operation = Operation {
        action: Action::FetchLinks,
        next: None,
        url: "test".to_owned(),
    };

    let resp = isahc::get(operation.url).unwrap().text().unwrap();
    let document = Document::from(resp.as_ref());
    // let acted = operation.action.act(&document);
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
