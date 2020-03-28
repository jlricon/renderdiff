use colored;
use colored::*;
use diff::{get_diff, Diff};
use renderdiff::db::get_diff_records_from_db;
fn main() {
    let records = get_diff_records_from_db(
        1,
        2,
        "https://www.vox.com/culture/2020/3/27/21195908/what-day-is-it-today-coronavirus",
    );
    let old = records
        .iter()
        .filter(|i| i.revision == 1)
        .nth(0)
        .unwrap()
        .content
        .clone();
    let new = records
        .into_iter()
        .filter(|i| i.revision == 2)
        .nth(0)
        .unwrap()
        .content;
    // assert_eq!(&old, &new);
    let diffed = get_diff(&old, &new);
    for chunk in &diffed.chunks {
        match chunk {
            Diff::Equal(e) => print!("{}", e.white()),
            Diff::Insert(e) => print!("{}", e.green()),
            Diff::Delete(e) => print!("{}", e.red()),
        }
    }
    // println!("{}", "bla".red());
    // let js = serde_json::to_string_pretty(&diffed).unwrap();
    // print!("{}", js);
}
