// use criterion::{criterion_group, criterion_main, Criterion};
// use difference;
// use dissimilar::diff;
// const S1: &str = include_str!("sample.txt");
// const S2: &str = include_str!("sample2.txt");
// fn test_diff() {
//     difference::Changeset::new(S1, S2, "");
// }

// fn test_diff2() {
//     diff(S1, S2);
// }
// fn difference_vs_dissimilar(c: &mut Criterion) {
//     let mut group = c.benchmark_group("difference_vs_dissimilar");
//     group.bench_function("difference", |b| b.iter(|| test_diff()));
//     group.bench_function("dissimilar", |b| b.iter(|| test_diff2()));

//     group.finish();
// }
// fn alternate_measurement() -> Criterion {
//     Criterion::default()
// }
// criterion_group!(name=benches;
//                 config = alternate_measurement();
//                 targets=difference_vs_dissimilar);
// criterion_main!(benches);
fn main() {}
