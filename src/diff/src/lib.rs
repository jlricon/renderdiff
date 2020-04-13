use dissimilar::{diff, Chunk};
#[cfg(feature = "serde_support")]
use serde::Serialize;
const TRIM_LEN: usize = 30;
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
/// Returns a difference between two strings
/// ```
/// use diff::{Diff,get_diff};
/// assert_eq!(get_diff("this is","this is").chunks,vec![Diff::Equal("this is")]);
/// assert_eq!(get_diff("th this is", "not this is a test").chunks,vec![
///                Diff::Insert("no"),
///                Diff::Equal("t"),
///                Diff::Delete("h"),
///                Diff::Equal(" this is"),
///                Diff::Insert(" a test")
///            ]);
/// ```
pub fn get_diff<'a>(a: &'a str, b: &'a str) -> Difference<'a> {
    Difference {
        chunks: diff(a, b).into_iter().map(|i| Diff::from(i)).collect(),
    }
}

pub fn strings_are_dif_equal<'a>(a: &'a str, b: &'a str) -> bool {
    // If all strings are equal and we filter them out, count=0
    diff(a, b)
        .iter()
        .filter(|m| match m {
            Chunk::Equal(_) => false,
            Chunk::Delete(_e) | Chunk::Insert(_e) => true,
        })
        .count()
        == 0
}
fn trim_string(a: String) -> String {
    if a.len() < (TRIM_LEN * 2 + 1) {
        a
    } else {
        format!(
            "{} [...] {}",
            a.chars().take(TRIM_LEN).collect::<String>(),
            a.chars()
                .rev()
                .take(TRIM_LEN)
                .collect::<String>()
                .chars()
                .rev()
                .collect::<String>(),
        )
    }
}
pub fn get_owned_diff(a: &str, b: &str) -> Vec<OwnedDiff> {
    diff(a, b)
        .into_iter()
        // Trim equal strings
        .map(|i| OwnedDiff::from(i))
        .map(|i| match i {
            OwnedDiff::Equal(e) => OwnedDiff::Equal(trim_string(e)),
            x => x,
        })
        .collect()
}
