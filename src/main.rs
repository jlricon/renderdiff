use renderdiff::push_vox_into_db;
use serde_json::Value;
// fn main() -> Result<(), DiffError> {
//     dotenv().ok();
//     push_vox_into_db()
// }
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::info;
use simple_logger;
fn main() {
    lambda!(handler)
}
struct Logger {
    logger_is_on: bool,
}
impl Logger {
    fn start_logging(&mut self) {
        if !self.logger_is_on {
            self.logger_is_on = true;
            simple_logger::init_with_level(log::Level::Info).unwrap();
        }
    }
}
static mut LOGGER: Logger = Logger {
    logger_is_on: false,
};
fn handler(event: Value, _ctx: Context) -> Result<(), HandlerError> {
    unsafe {
        LOGGER.start_logging();
    }
    info!("{}", event.to_string());
    Ok(push_vox_into_db().unwrap())
}
