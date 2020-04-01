use lambda_runtime::{error::HandlerError, lambda, Context};
use log::info;
use renderdiff::push_vox_into_db;
use simple_logger;
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

fn handler(event: renderdiff::parser::Request, _ctx: Context) -> Result<(), HandlerError> {
    unsafe {
        LOGGER.start_logging();
    }
    info!("{:?}", event);
    Ok(push_vox_into_db(event).unwrap())
}
