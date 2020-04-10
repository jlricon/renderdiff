import { NowRequest, NowResponse } from "@now/node";
import { diff_match_patch, Diff } from "diff-match-patch";
import fetch from "isomorphic-unfetch";
const TRIM_LEN = 30;
const hasuraHeaders = {
  "x-hasura-admin-secret": process.env.HASURA_TOKEN as string,
  "Content-Type": "application/json",
};

enum RequestType {
  DiffTwo = "diff_two",
  LastDiffs = "last_diffs",
}
const dpm = new diff_match_patch();
const doDiff = (x: string, y: string) => {
  let diffs = dpm.diff_main(x, y);
  dpm.diff_cleanupSemantic(diffs);
  return diffs;
};

export default async (request: NowRequest, response: NowResponse) => {
  const { kind, params } = request.body;
  let ret;

  if (kind === RequestType.LastDiffs) {
    ret = await getLastDiffs(params.n, params.offset);
  } else if (kind === RequestType.DiffTwo) {
    ret = await getDiffForUrlAndRevisions(params.url, params.v1, params.v2);
  } else {
    throw "Oops";
  }
  response.json({ data: ret });
};
interface HasuraLastDiffResponse {
  latest: boolean;
  url: string;
  content: string;
  revision: number;
  date_seen: string;
}
// Returns the diffs of the last 20 changes wrt their previous changes
async function getLastDiffs(n: number, offset: number) {
  let some_data = await fetch("https://hasura-ss.herokuapp.com/v1/graphql", {
    method: "POST",
    headers: hasuraHeaders,
    body: JSON.stringify({
      query: `query MyQuery($lim: Int!, $offset: Int!) {last_diffs(args: {lim: $lim, offs: $offset}) {
            url
            revision
            date_seen
            content
            latest
          }}`,
      variables: { lim: n, offset: offset },
    }),
  })
    .catch((e) => {
      console.log(e);
      return new Response("Server error of some kind...", {
        status: 500,
        statusText: "Internal Server Error",
      });
    })
    .then((e) => e.json());
  const records: HasuraLastDiffResponse[] = some_data.data.last_diffs;
  const new_records = records.filter((r) => r.latest);
  const old_records = records.filter((r) => !r.latest);
  new_records.sort((a, b) => compare(a.url, b.url));
  old_records.sort((a, b) => compare(a.url, b.url));
  let res = [];
  for (var i = 0; i < new_records.length; i += 1) {
    const one_diff = doDiff(old_records[i].content, new_records[i].content);
    res.push({
      diff: one_diff.map(diffToJsonDiff),
      url: old_records[i].url,
      last_revision: new_records[i].revision,
      prev_revision: old_records[i].revision,
      date_seen1: old_records[i].date_seen,
      date_seen2: new_records[i].date_seen,
    });
  }
  res.sort((a, b) => compare(b.date_seen2, a.date_seen2));

  // Returns [(url,last_revision,site,diff,date_seen1,date_seen2)]
  return res;
}
// Query last 10 edits
function compare(a: string, b: string) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

function diffToJsonDiff(a: Diff) {
  switch (a[0]) {
    case -1:
      return { Delete: a[1] };
    case 0:
      return { Equal: trimLen(a[1]) };
    case 1:
      return { Insert: a[1] };
  }
}
function trimLen(str: string): string {
  if (str.length < TRIM_LEN * 2 + 1) {
    return str;
  } else {
    const part1 = str.slice(0, TRIM_LEN);
    const part2 = str.slice(str.length - TRIM_LEN, -1);
    return part1 + " [...] " + part2;
  }
}
interface HasuraTwoDiffResponse {
  content: string;
  revision: number;
  date_seen: string;
}
async function getDiffForUrlAndRevisions(url: string, v1: number, v2: number) {
  let some_data = await fetch("https://hasura-ss.herokuapp.com/v1/graphql", {
    method: "POST",
    headers: hasuraHeaders,
    body: JSON.stringify({
      query: `query MyQuery($url: String!, $rev1: Int!, $rev2: Int!) {
          vox_records(where: {url: {_eq: $url}, revision: {_in: [$rev1,$rev2]}}) {
            content, revision, date_seen
          }
        }`,
      variables: { url: url, rev1: v1, rev2: v2 },
    }),
  })
    .catch((e) => {
      console.log(e);
      return new Response("Server error of some kind...", {
        status: 500,
        statusText: "Internal Server Error",
      });
    })
    .then((e) => e.json());
  console.log(JSON.stringify(some_data.data));
  const records: HasuraTwoDiffResponse[] = some_data.data.vox_records;
  if (records.length == 0) {
    return {};
  }
  const content_v1 = records.filter((e) => e.revision === v1)[0];
  const content_v2 = records.filter((e) => e.revision === v2)[0];
  const diffed_text = doDiff(content_v1.content, content_v2.content).map(
    diffToJsonDiff
  );
  return {
    diff: diffed_text,
    date_rev1: content_v1.date_seen,
    date_rev2: content_v2.date_seen,
  };
}
