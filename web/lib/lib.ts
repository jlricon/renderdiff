import fetch from "isomorphic-unfetch";
const HOST = "https://diff_text.jlricon.workers.dev/";
export type Diff = "Equal" | "Insert" | "Delete";
export type DiffDict = { [kind in Diff]: string };
interface WorkerRequest {
  url: string;
  v1: number;
  v2: number;
}
interface Diffs {
  data: DiffDict[];
}
export async function getLatestDiffs(
  url: string,
  v1: number,
  v2: number
): Promise<Diffs> {
  const req: WorkerRequest = {
    v1: v1,
    v2: v2,
    url: url
  };
  const resp = await fetch(HOST, {
    method: "POST",
    body: JSON.stringify(req)
  }).then(e => e.json());
  return resp as Diffs;
}
