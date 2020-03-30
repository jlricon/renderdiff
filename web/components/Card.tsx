import { DiffDict } from "../lib/lib";
import { DiffBunch } from "../lib/lib";
import { RevisionButton } from "./RevisionButton";

const Card = (data: DiffBunch, k: number) => (
  <div
    className="bg-white shadow overflow-hidden sm:rounded-lg ml-10 mr-10 max-w-6xl mb-5"
    key={k}
  >
    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
      <h3 className="text-md leading-3 font-medium text-gray-900">
        <div className="flex justify-between">
          <p>Last: {data.date_seen2.slice(0, 16).replace("T", " ")}</p>
          <RevisionButton rev1={data.prev_revision} rev2={data.last_revision} />

          <p>Previous: {data.date_seen1.slice(0, 16).replace("T", " ")}</p>
        </div>
      </h3>
      <p className="mt-1 text-sm leading-5 text-gray-500">
        From{" "}
        <a className="hover:text-teal-300" href={data.url}>
          {data.url}
        </a>
      </p>
    </div>

    <div className="bg-gray-50 px-4 py-5 sm:gap-4 sm:px-6 text-sm text-justify">
      {data.diff.map((e, index) => coloredDiff(e, index))}
    </div>
  </div>
);
export default Card;
function coloredDiff(diff: DiffDict, index: number) {
  if ("Equal" in diff) {
    return (
      <span className="font-hairline" key={index}>
        {/* {diff["Equal"].slice(0, 30) +
          "[...]" +
          diff["Equal"].slice(diff["Equal"].length - 30, diff["Equal"].length)} */}
        {diff["Equal"]}
      </span>
    );
  }
  if ("Delete" in diff) {
    return (
      <span className="text-red-600 font-medium bg-red-100" key={index}>
        {diff["Delete"]}
      </span>
    );
  }
  if ("Insert" in diff) {
    return (
      <span className="text-green-600 font-medium  bg-green-100" key={index}>
        {diff["Insert"]}
      </span>
    );
  }
}
