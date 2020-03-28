table! {
    vox_records (url, revision) {
        url -> Text,
        date_seen -> Timestamp,
        content -> Text,
        revision -> Int4,
        latest -> Bool,
        site -> Varchar,
    }
}
