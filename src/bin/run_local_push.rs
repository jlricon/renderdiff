use dotenv;
use log::info;
use rayon;
use renderdiff::parser::types::*;
use renderdiff::push_vox_into_db;
use serde_json;
use simple_logger;
struct InitServices {
    logger_is_on: bool,
}
impl InitServices {
    fn start_logging(&mut self) {
        if !self.logger_is_on {
            self.logger_is_on = true;
            simple_logger::init_with_level(log::Level::Info).unwrap();
        }
    }
}
static mut LOGGER: InitServices = InitServices {
    logger_is_on: false,
};

fn main() {
    unsafe {
        LOGGER.start_logging();
    }
    rayon::ThreadPoolBuilder::new()
        .num_threads(3)
        .build_global()
        .unwrap();
    dotenv::dotenv().ok();
    let event = SerializableScrapingCondition {
        base_url: "https://www.bbc.co.uk/news".to_owned(),
        links: SerializableLinkScrapingCondition {
            selector: r#"a.nw-o-link-split__anchor"#.to_owned(),
            href_regex: "/news".to_owned(),
            href_regex_exclude: Some("/live".to_owned()),
        },
        content: SerializableContentScrapingCondition {
            selectors: vec![
                "div.story-body".to_owned(),
                "div.vxp-media__body".to_owned(),
                "div.Theme-Layer-BodyText".to_owned(),
                "div.two-column-grid".to_owned(),
            ],
        },
    };
    info!("{}", serde_json::to_string(&event).unwrap());
    push_vox_into_db(event.into(), false).unwrap()
}
