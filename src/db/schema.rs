table! {
    vox_records (id) {
        url -> Text,
        date_seen -> Timestamp,
        content -> Text,
        revision -> Int4,
        latest -> Bool,
        site -> Varchar,
        id -> Int4,
    }
}
