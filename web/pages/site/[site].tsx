import {
  getLatestDiffsBySite,
  DiffBunch,
  stringToDateBunch,
} from "../../lib/lib";
import Card from "../../components/Card";
import { useState, useEffect } from "react";
import Dashboard from "../../components/Dashboard";
import { LoadMoreButton } from "../../components/LoadMoreButton";
import { Footer } from "../../components/Footer";
import { GetServerSideProps } from "next";
import auth0 from "../../lib/auth0";
import Link from "next/link";

interface Props {
  diffs: DiffBunch<number>[];
  sites: string[];
  isLoggedIn: boolean;
  site: string;
}
function Home({ diffs, sites, isLoggedIn, site }: Props) {
  // const empty = [] as DiffBunch<number>[];
  const [dataState, setData] = useState(diffs);
  const [loadedN, setLoadedN] = useState(dataState.length);

  const [allLoaded, setAllLoaded] = useState(loadedN === 0);
  async function getNMoreDiffs(n: number) {
    const { diffs } = await getLatestDiffsBySite(n, loadedN, site);
    const newData = diffs;
    const prevLen = dataState.length;
    const concatted = dataState.concat(newData);
    setData(concatted);
    if (newData.length !== 0) {
      setLoadedN(newData.length + prevLen);
    } else {
      setAllLoaded(true);
    }
  }

  return (
    <Dashboard isLoggedIn={isLoggedIn}>
      <div
        className="flex flex-row h-cover w-cover"
        // style={{ minHeight: "100vh", minWidth: "fit-content" }}
      >
        <div className=" hidden md:block ">
          <h2 className="text-center mb-3 lg:mb-2 text-gray-500 uppercase tracking-wide font-bold text-sm lg:text-xs">
            {" "}
            Sites available
          </h2>
          <ul>
            {sites.map((c, index) => (
              <Link href={`/site/${c}`} key={index}>
                <a
                  className="px-2 -mx-2 py-1 transition duration-200 ease-in-out
                 relative block hover:translate-x-2px hover:text-gray-900 text-gray-600 font-medium
                 bg-gray-200 my-2 rounded"
                >
                  {c}
                </a>
              </Link>
            ))}
          </ul>
        </div>
        <div className="mx-auto">
          <main>
            {dataState.map((c, index) => (
              <Card data={stringToDateBunch(c)} key={index} />
            ))}
          </main>
          <div className="justify-center text-center pb-3">
            <LoadMoreButton isLoaded={allLoaded} handler={getNMoreDiffs} />
          </div>
          <Footer />
        </div>
      </div>
    </Dashboard>
  );
}

export default Home;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const site: string = ctx.req.url?.split("/site/")[1] as string;
  const data = getLatestDiffsBySite(10, 0, site);
  let isLoggedIn = false;
  if (typeof window === "undefined") {
    const ses = await auth0.getSession(ctx.req);
    if (ses) {
      isLoggedIn = true;
    }
  }
  const { diffs, sites } = await data;
  return { props: { diffs, isLoggedIn, sites, site } };
};
