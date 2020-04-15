import { getLatestDiffs, DiffBunch, Diff, stringToDateBunch } from "../lib/lib";
import Card from "../components/Card";
import { useState, useEffect } from "react";
import Dashboard from "../components/Dashboard";
import { LoadMoreButton } from "../components/LoadMoreButton";
import { Footer } from "../components/Footer";
import { GetServerSideProps } from "next";
import auth0 from "../lib/auth0";
import Link from "next/link";
import LinkSidebar from "../components/LinkSidebar";

interface Props {
  diffs: DiffBunch<number>[];
  sites: string[];
  isLoggedIn: boolean;
}
function Home({ diffs, sites, isLoggedIn }: Props) {
  // const empty = [] as DiffBunch<number>[];
  const [dataState, setData] = useState(diffs);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedN, setLoadedN] = useState(dataState.length);
  const [allLoaded, setAllLoaded] = useState(false);
  async function getNMoreDiffs(n: number) {
    setIsLoading(true);
    const { diffs } = await getLatestDiffs(n, loadedN);
    const newData = diffs;
    const prevLen = dataState.length;
    const concatted = dataState.concat(newData);
    setData(concatted);
    if (newData.length !== 0) {
      setLoadedN(newData.length + prevLen);
    } else {
      setAllLoaded(true);
    }
    setIsLoading(false);
  }

  return (
    <Dashboard isLoggedIn={isLoggedIn} isLoading={isLoading}>
      <div className="flex flex-row h-cover w-cover">
        <LinkSidebar sites={sites} />
        <div className="mx-auto">
          <main>
            {dataState.map((c) => (
              <Card
                data={stringToDateBunch(c)}
                key={c.url + c.last_revision + c.prev_revision}
              />
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
  const data = getLatestDiffs(10, 0);
  let isLoggedIn = false;
  if (typeof window === "undefined") {
    const ses = await auth0.getSession(ctx.req);
    if (ses) {
      isLoggedIn = true;
    }
  }
  const { diffs, sites } = await data;
  return { props: { diffs, isLoggedIn, sites } };
};
