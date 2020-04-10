import fetch from "isomorphic-unfetch";
import configs from "./config";
// TODO Make into an enum
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
export interface DiffBunch<T> {
  url: string;
  last_revision: number;
  prev_revision: number;
  date_seen1: T;
  date_seen2: T;
  diff: DiffDict[];
}
interface LastDiffs<T> {
  data: DiffBunch<T>[];
}

// Returns [(url,last_revision,site,diff,date_seen1,date_seen2)]
export async function getLatestDiffs(
  n: number,
  offset: number
): Promise<LastDiffs<number>> {
  const req: WorkerRequestLastDiffs = {
    kind: "last_diffs",
    params: { n: n, offset: offset },
  };
  let resp: LastDiffs<string | number> = await fetch(
    configs.baseUrl + "/api/diff",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    }
  ).then((e) => e.json());
  resp.data.map((d) => {
    d.date_seen1 = Date.parse(d.date_seen1 as string);
    d.date_seen2 = Date.parse(d.date_seen2 as string);
  });
  let resp2 = resp as LastDiffs<number>;
  resp2.data = resp2.data.sort((a, b) => b.date_seen2 - a.date_seen2);
  return resp2 as LastDiffs<number>;
}
interface DiffTwoReturn {
  diff: DiffDict[];
  date_rev1: number;
  date_rev2: number;
}
export async function getDiffsForTwo(
  url: string,
  rev1: number,
  rev2: number
): Promise<DiffTwoReturn> {
  const req = {
    kind: "diff_two",
    params: { url: url, v1: rev1, v2: rev2 },
  };
  let resp = await fetch(configs.baseUrl + "/api/diff", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  }).then((e) => e.json());

  resp.date_rev1 = Date.parse(resp.date_rev1 as string);
  resp.date_rev2 = Date.parse(resp.date_rev2 as string);
  const resp2: DiffTwoReturn = resp.data;
  return resp2;
}
export function stringToDateBunch(x: DiffBunch<number>): DiffBunch<Date> {
  return {
    diff: x.diff,
    last_revision: x.last_revision,
    prev_revision: x.prev_revision,
    url: x.url,
    date_seen1: new Date(x.date_seen1),
    date_seen2: new Date(x.date_seen2),
  };
}
