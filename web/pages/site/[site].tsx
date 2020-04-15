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
import Link from "next/link";
import { useRouter } from "next/router";
import LinkSidebar from "../../components/LinkSidebar";

const HomeForSite = () => {
  const router = useRouter();
  const { site } = router.query;
  const empty = [] as DiffBunch<number>[];
  const [isLoading, setIsLoading] = useState(false);
  const [dataState, setData] = useState(empty);
  const [loadedN, setLoadedN] = useState(dataState.length);
  const [allLoaded, setAllLoaded] = useState(false);
  const [sites, setSites] = useState([] as string[]);
  async function getNMoreDiffs(
    n: number,
    loadedN: number,
    dataState: DiffBunch<number>[]
  ) {
    setIsLoading(true);
    const { diffs, sites } = await getLatestDiffsBySite(
      n,
      loadedN,
      site as string
    );
    const newData = diffs;
    const prevLen = dataState.length;
    const concatted = dataState.concat(newData);
    setData(concatted);
    setSites(sites);
    if (newData.length !== 0) {
      setLoadedN(newData.length + prevLen);
    } else {
      setAllLoaded(true);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    // Create an scoped async function in the hook
    async function changeSite() {
      setAllLoaded(false);
      setLoadedN(0);
      setData([]);
      if (site) {
        await getNMoreDiffs(10, 0, []);
      }
    }
    // Execute the created function directly
    changeSite();
  }, [site]);

  return (
    <Dashboard isLoggedIn={false} isLoading={isLoading}>
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
            <LoadMoreButton
              isLoaded={allLoaded}
              handler={(n) => getNMoreDiffs(n, loadedN, dataState)}
            />
          </div>
          <Footer />
        </div>
      </div>
    </Dashboard>
  );
};

export default HomeForSite;
