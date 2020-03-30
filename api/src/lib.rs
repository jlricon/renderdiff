extern crate cfg_if;
extern crate wasm_bindgen;
// #[macro_use]
// extern crate serde_derive;
mod utils;
use cfg_if::cfg_if;
use diff::get_owned_diff;
use wasm_bindgen::prelude::*;
cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

#[wasm_bindgen]
pub fn diff_text(a: &str, b: &str) -> JsValue {
    let res = get_owned_diff(a, b);
    JsValue::from_serde(&res).unwrap()
}
// #[derive(Deserialize, Serialize)]
// pub struct ManyData {
//     pub last_diffs: Vec<DbRow>,
// }
// #[derive(Deserialize, Serialize)]
// pub struct DbRow {
//     pub url: String,
//     pub site: String,
//     pub revision: u32,
//     pub date_seen: String,
//     pub content: String,
// }

// #[wasm_bindgen]
// pub fn diff_many_text(x: &JsValue) -> Vec<u32> {
//     let vals: ManyData = x.into_serde().unwrap();
//     let records:Vec<dbRow>=vals.last_diffs;
//     // JsValue::from_serde("hi").unwrap()
//     vec![vals.last_diffs[0].revision]
// }
