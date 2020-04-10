import { getLatestDiffs, DiffBunch, Diff, stringToDateBunch } from "../lib/lib";
import Card from "../components/Card";
import { useState, useEffect } from "react";
import Dashboard from "../components/Dashboard";
import { LoadMoreButton } from "../components/LoadMoreButton";
import { Footer } from "../components/Footer";
import { GetServerSideProps } from "next";
import auth0 from "../lib/auth0";

interface Props {
  data: DiffBunch<number>[];
  isLoggedIn: boolean;
}
function Home({ data, isLoggedIn }: Props) {
  const empty = [] as DiffBunch<number>[];
  const [dataState, setData] = useState(data);
  const [loadedN, setLoadedN] = useState(dataState.length);
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
  useEffect(() => {
    // Create an scoped async function in the hook
    async function anyNameFunction() {
      await handleButtonClick(10);
    }
    // Execute the created function directly
    anyNameFunction();
  }, []);
  return (
    <Dashboard isLoggedIn={isLoggedIn}>
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const data = getLatestDiffs(10, 0);
  let isLoggedIn = false;
  if (typeof window === "undefined") {
    const ses = await auth0.getSession(ctx.req);
    if (ses) {
      isLoggedIn = true;
    }
  }
  return { props: { data: (await data).data, isLoggedIn } };
};
