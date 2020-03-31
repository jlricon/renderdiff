import fetch from "isomorphic-unfetch";
const HOST = "https://diff_text.jlricon.workers.dev/";
export type Diff = "Equal" | "Insert" | "Delete";
export type DiffDict = { [kind in Diff]: string };
export type WorkerRequest = WorkerRequestDiffTwo | WorkerRequestLastDiffs;
interface WorkerRequestDiffTwo {
  kind: "diff_two";
  params: { url: string; v1: number; v2: number };
}
interface WorkerRequestLastDiffs {
  kind: "last_diffs";
  params: { n: number; offset: number };
}
interface Diffs {
  data: DiffDict[];
}
export interface DiffBunch {
  url: string;
  last_revision: number;
  prev_revision?: number;
  date_seen1: string;
  date_seen2: string;
  diff: DiffDict[];
}
interface LastDiffs {
  data: DiffBunch[];
}
// Returns [(url,last_revision,site,diff,date_seen1,date_seen2)]
export async function getLatestDiffs(
  n: number,
  offset: number
): Promise<LastDiffs> {
  const req: WorkerRequestLastDiffs = {
    kind: "last_diffs",
    params: { n: n, offset: offset }
  };
  let resp: LastDiffs = await fetch(HOST, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(req)
  }).then(e => e.json());

  return resp;
}
interface DiffTwoReturn {
  diff: DiffDict[];
  date_rev1: string;
  date_rev2: string;
}
export async function getDiffsForTwo(
  url: string,
  rev1: number,
  rev2: number
): Promise<DiffTwoReturn> {
  const req = {
    kind: "diff_two",
    params: { url: url, v1: rev1, v2: rev2 }
  };
  let resp = await fetch(HOST, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(req)
  }).then(e => e.json());
  console.log(resp);
  return resp.data;
}
