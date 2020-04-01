import { DiffDict, getDiffsForTwo } from "../lib/lib";
import { DiffBunch } from "../lib/lib";
import { RevisionButton } from "./RevisionButton";
import { useState } from "react";
interface Props {
  data: DiffBunch<Date>;
}
function Card({ data }: Props) {
  const [dataState, setData] = useState(data);
  const [lastRevision, setLastRevision] = useState(data.last_revision);
  async function updateDataAfterSliderIsClicked(rev1: number, rev2: number) {
    const resp = await getDiffsForTwo(dataState.url, rev1, rev2);
    const newData: DiffBunch<Date> = {
      diff: resp.diff,
      last_revision: rev2,
      prev_revision: rev1,
      url: dataState.url,
      date_seen1: new Date(resp.date_rev1),
      date_seen2: new Date(resp.date_rev2)
    };

    setData(newData);
  }
  return (
    <div className="bg-white shadow sm:rounded-lg ml-10 mr-10 max-w-6xl mb-5 justify-center">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-md leading-3 font-medium text-gray-900">
          <div className="flex justify-between">
            <p>
              Previous:{" "}
              {dataState.date_seen1
                .toISOString()
                .slice(0, 16)
                .replace("T", " ")}
            </p>
            <RevisionButton
              rev1={dataState.prev_revision}
              rev2={dataState.last_revision}
              lastRevision={lastRevision}
              updateHandler={updateDataAfterSliderIsClicked}
            />

            <p>
              Last:{" "}
              {dataState.date_seen2
                .toISOString()
                .slice(0, 16)
                .replace("T", " ")}
            </p>
          </div>
        </h3>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          From{" "}
          <a className="hover:text-teal-300" href={dataState.url}>
            {dataState.url}
          </a>
        </p>
      </div>

      <div className="bg-gray-50 px-4 py-5 sm:gap-4 sm:px-6 text-sm text-justify break-all">
        {dataState.diff.map((e, index) => (
          // @ts-ignore
          <ColoredDiff diff={e} key={index} />
        ))}
      </div>
    </div>
  );
}
interface ColoredDiffProps {
  diff: DiffDict;
}
export default Card;
const ColoredDiff = ({ diff }: ColoredDiffProps) => {
  if ("Equal" in diff) {
    return (
      <span className="font-hairline">
        {/* {diff["Equal"].slice(0, 30) +
          "[...]" +
          diff["Equal"].slice(diff["Equal"].length - 30, diff["Equal"].length)} */}
        {diff["Equal"]}
      </span>
    );
  } else if ("Delete" in diff) {
    return (
      <span className="text-red-600 font-medium bg-red-100">
        {diff["Delete"]}
      </span>
    );
  } else if ("Insert" in diff) {
    return (
      <span className="text-green-600 font-medium  bg-green-100">
        {diff["Insert"]}
      </span>
    );
  }
};
