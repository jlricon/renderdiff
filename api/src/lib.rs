extern crate cfg_if;
extern crate wasm_bindgen;

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
