mod models;
mod schema;
use crate::{LinkContent, LinkRef, VoxRecord};
use chrono::{Duration, Utc};
use diesel::prelude::*;
use dotenv::dotenv;
use models::{InsertableVoxDbRecord, VoxDbRecord};
use schema::vox_records;
use std::{collections::HashSet, env};
use url::Url;
const LOOKBACK_PERIOD: i64 = 90;
pub fn establish_connection() -> PgConnection {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    PgConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}
/// We get the items that we have seen in the db previously
/// Only interested in stuff more recent than 3 days(We assume they don't change articles that far back)
pub fn get_previous_items() -> Vec<VoxRecord> {
    use schema::vox_records::dsl::*;
    let conn = establish_connection();
    let two_days_ago = Utc::now()
        .naive_utc()
        .checked_sub_signed(Duration::days(LOOKBACK_PERIOD))
        .unwrap();
    vox_records
        .filter(latest.eq(true))
        .filter(date_seen.ge(two_days_ago))
        .load::<VoxDbRecord>(&conn)
        .unwrap()
        .into_iter()
        .map(|r| VoxRecord {
            url: r.url,
            content: r.content.clone(),
            revision: r.revision as u32,
        })
        .collect()
}
pub fn insert_records_first_seen(records: &[&LinkContent]) {
    let insertables: Vec<InsertableVoxDbRecord> = records
        .iter()
        .map(|i| InsertableVoxDbRecord {
            url: i.0.to_owned(),
            content: i.1.clone(),
            date_seen: Utc::now().naive_utc(),
            revision: 1,
            latest: true,
            site: Url::parse(&i.0).unwrap().host_str().unwrap().to_owned(),
        })
        .collect();
    let conn = establish_connection();
    diesel::insert_into(vox_records::table)
        .values(insertables)
        .execute(&conn)
        .unwrap();
}
use diesel::result::Error;
pub fn insert_diff_records_and_update_previous(records: &Vec<VoxRecord>) {
    use schema::vox_records::dsl::{latest, url};
    let existing_urls: HashSet<LinkRef> = records.iter().map(|i| i.url.as_ref()).collect();
    let insertables: Vec<InsertableVoxDbRecord> = records
        .iter()
        .map(|i| InsertableVoxDbRecord {
            url: i.url.clone(),
            content: i.content.clone(),
            date_seen: Utc::now().naive_utc(),
            revision: i.revision as i32,
            latest: true,
            site: Url::parse(&i.url).unwrap().host_str().unwrap().to_owned(),
        })
        .collect();
    let conn = establish_connection();
    conn.transaction::<usize, Error, _>(|| {
        diesel::update(vox_records::table.filter(url.eq_any(existing_urls)))
            .set(latest.eq(false))
            .execute(&conn)
            .unwrap();
        diesel::insert_into(vox_records::table)
            .values(insertables)
            .execute(&conn)
    })
    .unwrap();
}
pub fn get_diff_records_from_db(revision1: u32, revision2: u32, input_url: &str) -> Vec<VoxRecord> {
    use schema::vox_records::dsl::*;
    let conn = establish_connection();

    vox_records
        .filter(revision.eq_any(vec![revision1 as i32, revision2 as i32]))
        .filter(url.eq(input_url))
        .load::<VoxDbRecord>(&conn)
        .unwrap()
        .into_iter()
        .map(|r| VoxRecord {
            url: r.url,
            content: r.content.clone(),
            revision: r.revision as u32,
        })
        .collect()
}
