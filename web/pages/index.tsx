import Head from "next/head";
import { getLatestDiffs, DiffBunch } from "../lib/lib";
import Card from "../components/Card";
import { GetServerSideProps, GetStaticProps } from "next";
import { useState, useEffect } from "react";
import Dashboard from "../components/Dashboard";

interface LoadMoreInterface {
  isLoaded: boolean;
  handler: (n: number) => Promise<void>;
}
const Footer = () => {
  return (
    <div className="justify-center text-center pb-10 font-medium text-xs">
      <a
        className="pl-2 hover:text-teal-300 "
        href="https://twitter.com/ArtirKel"
      >
        A public service by Jose Luis Ricon
      </a>{" "}
      (
      <a className="hover:text-teal-300 " href="mailto:jose@ricon.xyz">
        email
      </a>
      )
    </div>
  );
};
const LoadMoreButton = ({ isLoaded, handler }: LoadMoreInterface) => {
  const commonCss =
    "bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow w-64";
  if (!isLoaded) {
    return (
      <button className={commonCss} onClick={event => handler(5)}>
        Load 5 more
      </button>
    );
  } else {
    return (
      <button disabled className={commonCss + " cursor-not-allowed opacity-50"}>
        No more records available
      </button>
    );
  }
};
interface Props {
  data: DiffBunch<number>[];
}
function Home({ data }: Props) {
  const [dataState, setData] = useState(data);
  const [loadedN, setLoadedN] = useState(data.length);
  const [allLoaded, setAllLoaded] = useState(false);
  async function handleButtonClick(n: number) {
    const newData = await getLatestDiffs(n, loadedN);
    const prevLen = dataState.length;
    const concatted = dataState.concat(newData.data);
    setData(concatted);
    if (newData.data.length !== 0) {
      setLoadedN(newData.data.length + prevLen);
    } else {
      setAllLoaded(true);
    }
  }

  return (
    <Dashboard>
      <div
        className="flex flex-col h-cover w-cover"
        // style={{ minHeight: "100vh", minWidth: "fit-content" }}
      >
        <div className="mx-auto">
          <main>
            {dataState.map((c, index) => (
              <Card data={stringToDateBunch(c)} key={index} />
            ))}
          </main>
          <div className="justify-center text-center pb-3">
            <LoadMoreButton isLoaded={allLoaded} handler={handleButtonClick} />
          </div>
          <Footer />
        </div>
      </div>
    </Dashboard>
  );
}

export default Home;

export const getServerSideProps: GetServerSideProps = async ctx => {
  const data = await getLatestDiffs(10, 0);
  return { props: { data: data.data } };
};
function stringToDateBunch(x: DiffBunch<number>): DiffBunch<Date> {
  return {
    diff: x.diff,
    last_revision: x.last_revision,
    prev_revision: x.prev_revision,
    url: x.url,
    date_seen1: new Date(x.date_seen1),
    date_seen2: new Date(x.date_seen2)
  };
}
