-- Your SQL goes here
CREATE TABLE public.vox_records (
	url text NOT NULL,
	date_seen timestamp NOT NULL,
	"content" text NOT NULL,
	revision int4 NOT NULL,
	latest bool NOT NULL,
	site varchar NOT NULL DEFAULT 'no_site'::character varying,
	CONSTRAINT vox_records_pkey PRIMARY KEY (url, revision)
);
CREATE INDEX vox_records_date_seen_idx ON public.vox_records USING btree (date_seen);
CREATE INDEX vox_records_latest_idx ON public.vox_records USING btree (latest, revision);
CREATE INDEX vox_records_url_idx ON public.vox_records USING btree (url);