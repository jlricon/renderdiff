use dotenv;
use log::info;
use renderdiff::parser::Request;
use renderdiff::parser::Target;
use renderdiff::push_vox_into_db;
use serde_json::to_string_pretty;
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
    dotenv::dotenv().ok();
    let event = Request {
        base_url: "http://www.slatestarcodex.com".to_owned(),
        link_targets: vec![Target::Attr {
            value: "bookmark".to_owned(),
            name: "rel".to_owned(),
        }],
        content_targets: vec![Target::Class {
            name: "pjgm-postcontent".to_owned(),
        }],
    };
    info!("{}", to_string_pretty(&event).unwrap());
    push_vox_into_db(event, false).unwrap()
}
