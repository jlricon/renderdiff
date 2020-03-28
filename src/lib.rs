pub mod db;
#[macro_use]
extern crate diesel;

pub type Link = String;
pub type LinkRef<'a> = &'a str;
type Content = String;
pub type LinkContent = (Link, Content);
pub struct VoxRecord {
    pub url: String,
    pub content: String,
    pub revision: u32,
}
