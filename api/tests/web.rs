//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

use wasm_bindgen::prelude::*;
use wasm_bindgen_test::*;
wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn pass() {
    // let mock = ManyData {
    //     last_diffs: vec![DbRow {
    //         url: "test".to_owned(),
    //         revision: 1,
    //         site: "test.com".to_owned(),
    //         date_seen: "date".to_owned(),
    //         content: "this is some content".to_owned(),
    //     }],
    // };
    // let js_mock = JsValue::from_serde(&mock).unwrap();
    // let ret = diff_many_text(&js_mock);
    // assert_eq!(ret, vec![1]);
}
