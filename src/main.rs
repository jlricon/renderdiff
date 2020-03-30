use dotenv::dotenv;
use renderdiff::push_vox_into_db;
use serde_json::Value;
// fn main() -> Result<(), DiffError> {
//     dotenv().ok();
//     push_vox_into_db()
// }
use lambda_runtime::{error::HandlerError, lambda, Context};
use simple_logger;
fn main() {
    lambda!(handler)
}

fn handler(event: Value, _: Context) -> Result<(), HandlerError> {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    Ok(push_vox_into_db().unwrap())
}
