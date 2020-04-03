mod models;
mod schema;
use crate::{LinkContentRef, LinkRef, RefVoxRecord, VoxRecord};
use chrono::{Duration, Utc};
use diesel::prelude::*;

use models::{InsertableVoxDbRecord, VoxDbRecord};
use schema::vox_records;
use std::{collections::HashSet, env};
use url::Url;
const LOOKBACK_PERIOD: i64 = 90;
pub fn establish_connection() -> PgConnection {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    PgConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}
/// We get the items that we have seen in the db previously
/// Only interested in stuff more recent than 3 days(We assume they don't change articles that far back)
pub fn get_previous_items(conn: &PgConnection, base_url: &str) -> Vec<VoxRecord> {
    use schema::vox_records::dsl::*;
    let base_url_root = Url::parse(base_url).unwrap().host_str().unwrap().to_owned();
    dbg!(&base_url_root);
    let two_days_ago = Utc::now()
        .naive_utc()
        .checked_sub_signed(Duration::days(LOOKBACK_PERIOD))
        .unwrap();
    vox_records
        .filter(latest.eq(true))
        .filter(site.eq(base_url_root))
        .filter(date_seen.ge(two_days_ago))
        .load::<VoxDbRecord>(conn)
        .unwrap()
        .into_iter()
        .map(|r| VoxRecord {
            url: r.url,
            content: r.content.clone(),
            revision: r.revision as u32,
        })
        .collect()
}
pub fn insert_records_first_seen(
    records: Vec<LinkContentRef>,
    conn: &PgConnection,
    base_url: &str,
) {
    let insertables: Vec<InsertableVoxDbRecord> = records
        .iter()
        .map(|i| InsertableVoxDbRecord {
            url: i.0,
            content: i.1,
            date_seen: Utc::now().naive_utc(),
            revision: 1,
            latest: true,
            site: Url::parse(base_url).unwrap().host_str().unwrap().to_owned(),
        })
        .collect();
    diesel::insert_into(vox_records::table)
        .values(insertables)
        .execute(conn)
        .unwrap();
}
use diesel::result::Error;
pub fn insert_diff_records_and_update_previous(
    records: &Vec<RefVoxRecord>,
    conn: &PgConnection,
    base_url: &str,
) {
    use schema::vox_records::dsl::{latest, url};
    let existing_urls: HashSet<LinkRef> = records.iter().map(|i| i.url.as_ref()).collect();
    let insertables: Vec<InsertableVoxDbRecord> = records
        .iter()
        .map(|i| InsertableVoxDbRecord {
            url: i.url,
            content: i.content,
            date_seen: Utc::now().naive_utc(),
            revision: i.revision as i32,
            latest: true,
            site: Url::parse(base_url).unwrap().host_str().unwrap().to_owned(),
        })
        .collect();
    conn.transaction::<usize, Error, _>(|| {
        diesel::update(vox_records::table.filter(url.eq_any(existing_urls)))
            .set(latest.eq(false))
            .execute(conn)
            .unwrap();
        diesel::insert_into(vox_records::table)
            .values(&insertables)
            .execute(conn)
    })
    .unwrap();
}
// pub fn get_diff_records_from_db(
//     revision1: u32,
//     revision2: u32,
//     input_url: &str,
//     conn: &PgConnection,
// ) -> Vec<VoxRecord> {
//     use schema::vox_records::dsl::*;

//     vox_records
//         .filter(revision.eq_any(vec![revision1 as i32, revision2 as i32]))
//         .filter(url.eq(input_url))
//         .load::<VoxDbRecord>(conn)
//         .unwrap()
//         .into_iter()
//         .map(|r| VoxRecord {
//             url: r.url,
//             content: r.content.clone(),
//             revision: r.revision as u32,
//         })
//         .collect()
// }
