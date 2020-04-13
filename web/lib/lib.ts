import fetch from "isomorphic-unfetch";
import configs from "./config";
import { RequestType } from "../pages/api/diff";
// TODO Make into an enum
export type Diff = "Equal" | "Insert" | "Delete";
export type DiffDict = { [kind in Diff]: string };
export type WorkerRequest =
  | WorkerRequestDiffTwo
  | WorkerRequestLastDiffs
  | WorkerRequestLastDiffsBySite;
interface WorkerRequestDiffTwo {
  kind: RequestType.DiffTwo;
  params: { url: string; v1: number; v2: number };
}
interface WorkerRequestLastDiffs {
  kind: RequestType.LastDiffs;
  params: { n: number; offset: number };
}
interface WorkerRequestLastDiffsBySite {
  kind: RequestType.LastDiffsBySite;
  params: { n: number; offset: number; site: string };
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
// interface LastDiffs<T> {
//   data: DiffBunch<T>[];
// }
interface LastDiffsReturn<T> {
  diffs: DiffBunch<T>[];
  sites: string[];
}
// Returns [(url,last_revision,site,diff,date_seen1,date_seen2)]
export async function getLatestDiffsBySite(
  n: number,
  offset: number,
  site: string
): Promise<LastDiffsReturn<number>> {
  const req: WorkerRequestLastDiffsBySite = {
    kind: RequestType.LastDiffsBySite,
    params: { n: n, offset: offset, site: site },
  };
  let { diffs, sites }: LastDiffsReturn<number | string> = await fetch(
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

  diffs.map((d) => {
    d.date_seen1 = Date.parse(d.date_seen1 as string);
    d.date_seen2 = Date.parse(d.date_seen2 as string);
  });
  let diffs2 = diffs as DiffBunch<number>[];
  diffs2 = diffs2.sort((a, b) => b.date_seen2 - a.date_seen2);
  return { diffs: diffs2 as DiffBunch<number>[], sites: sites };
}
export async function getLatestDiffs(
  n: number,
  offset: number
): Promise<LastDiffsReturn<number>> {
  const req: WorkerRequestLastDiffs = {
    kind: RequestType.LastDiffs,
    params: { n: n, offset: offset },
  };
  let { diffs, sites }: LastDiffsReturn<number | string> = await fetch(
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
  diffs.map((d) => {
    d.date_seen1 = Date.parse(d.date_seen1 as string);
    d.date_seen2 = Date.parse(d.date_seen2 as string);
  });
  let diffs2 = diffs as DiffBunch<number>[];
  diffs2 = diffs2.sort((a, b) => b.date_seen2 - a.date_seen2);
  return { diffs: diffs2 as DiffBunch<number>[], sites: sites };
}
interface DiffTwoReturn {
  diffs: DiffDict[];
  date_rev1: number;
  date_rev2: number;
}
export async function getDiffsForTwo(
  url: string,
  rev1: number,
  rev2: number
): Promise<DiffTwoReturn> {
  const req = {
    kind: RequestType.DiffTwo,
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
  return resp;
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
