use super::schema::vox_records;
use chrono::NaiveDateTime;
use diesel::{Insertable, Queryable};
#[derive(Queryable)]
pub struct VoxDbRecord {
    pub url: String,
    pub date_seen: NaiveDateTime,
    pub content: String,
    pub revision: i32,
    pub latest: bool,
    pub site: String,
}
#[derive(Insertable)]
#[table_name = "vox_records"]
pub struct InsertableVoxDbRecord {
    pub url: String,
    pub date_seen: NaiveDateTime,
    pub content: String,
    pub revision: i32,
    pub latest: bool,
    pub site: String,
}
