use lambda_runtime::{error::HandlerError, lambda, Context};
use log::info;
use renderdiff::push_vox_into_db;
use sentry;
use sentry::integrations::panic::register_panic_handler;
use simple_logger;
use std::env;
fn main() {
    lambda!(handler)
}
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

fn handler(
    event: renderdiff::parser::types::SerializableScrapingCondition,
    _ctx: Context,
) -> Result<(), HandlerError> {
    unsafe {
        LOGGER.start_logging();
    }
    let _guard = sentry::init(env::var("SENTRY_URL").unwrap());
    sentry::capture_message(&format!("Got event {:?}", &event), sentry::Level::Info);
    register_panic_handler();
    info!("{:?}", event);
    Ok(push_vox_into_db(event.into(), false).unwrap())
}
