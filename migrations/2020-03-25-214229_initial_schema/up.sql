-- Your SQL goes here
CREATE TABLE vox_records(
    url TEXT NOT NULL,
    date_seen timestamp NOT NULL,
    content TEXT NOT NULL,
    revision INT NOT NULL,
    latest BOOLEAN NOT NULL,
    PRIMARY KEY (url, revision)
);
CREATE INDEX vox_records_url_IDX ON vox_records (url);