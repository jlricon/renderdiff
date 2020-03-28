use dissimilar::{diff, Chunk};
#[cfg(feature = "serde_support")]
use serde::Serialize;
#[cfg_attr(feature = "serde_support", derive(Serialize))]
#[derive(Debug, PartialEq, Eq)]
pub enum Diff<'a> {
    Equal(&'a str),
    Insert(&'a str),
    Delete(&'a str),
}
#[cfg_attr(feature = "serde_support", derive(Serialize))]
#[derive(Debug, PartialEq, Eq)]
pub enum OwnedDiff {
    Equal(String),
    Insert(String),
    Delete(String),
}
impl<'a> From<Chunk<'a>> for Diff<'a> {
    fn from(c: Chunk<'a>) -> Self {
        match c {
            Chunk::Insert(e) => Diff::Insert(e),
            Chunk::Equal(e) => Diff::Equal(e),
            Chunk::Delete(e) => Diff::Delete(e),
        }
    }
}
impl<'a> From<Chunk<'a>> for OwnedDiff {
    fn from(c: Chunk<'a>) -> Self {
        match c {
            Chunk::Insert(e) => OwnedDiff::Insert(e.to_owned()),
            Chunk::Equal(e) => OwnedDiff::Equal(e.to_owned()),
            Chunk::Delete(e) => OwnedDiff::Delete(e.to_owned()),
        }
    }
}
#[cfg_attr(feature = "serde_support", derive(Serialize))]
#[derive(Debug)]
pub struct Difference<'a> {
    pub chunks: Vec<Diff<'a>>,
}
pub fn get_diff<'a>(a: &'a str, b: &'a str) -> Difference<'a> {
    Difference {
        chunks: diff(a, b).into_iter().map(|i| Diff::from(i)).collect(),
    }
}

pub fn get_owned_diff(a: &str, b: &str) -> Vec<OwnedDiff> {
    diff(a, b).into_iter().map(|i| OwnedDiff::from(i)).collect()
}
#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_diff2() {
        let ret = get_diff("th this is", "not this is a test");
        assert_eq!(
            ret.chunks,
            vec![
                Diff::Insert("no"),
                Diff::Equal("t"),
                Diff::Delete("h"),
                Diff::Equal(" this is"),
                Diff::Insert(" a test")
            ]
        );
    }
}
