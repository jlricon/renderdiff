import Head from "next/head";
import { getLatestDiffs, DiffBunch } from "../lib/lib";
import Card from "../components/Card";
import { GetServerSideProps, GetStaticProps } from "next";
import { useState, useEffect } from "react";
const LoadMoreButton = ({ isLoaded, handler }) => {
  const commonCss =
    "bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow w-64";
  if (!isLoaded) {
    return (
      <button className={commonCss} onClick={event => handler(5)}>
        Load More
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
  data: DiffBunch[];
}
function Home({ data }: Props) {
  const [dataState, setData] = useState(data);
  const [loadedN, setLoadedN] = useState(data.length);
  const [allLoaded, setAllLoaded] = useState(false);
  async function handleButtonClick(n: number) {
    const newData = await getLatestDiffs(n, loadedN);
    const prevLen = dataState.length;
    setData(dataState.concat(newData.data));
    console.log(newData.data.length, dataState.length);
    if (newData.data.length !== 0) {
      setLoadedN(newData.data.length + prevLen);
    } else {
      setAllLoaded(true);
    }
  }
  useEffect(() => {
    // Create an scoped async function in the hook
    // async function anyNameFunction() {
    //   await handleButtonClick(10);
    // }
    // // Execute the created function directly
    // anyNameFunction();
  }, []);
  return (
    <div
      className="flex flex-col bg-gray-100 h-cover w-cover"
      style={{ minHeight: "100vh", minWidth: "fit-content" }}
    >
      <Head>
        <title>Commitment</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 className="font-bold  text-4xl md:text-6xl text-center text-gray-800">
        <a>Commitment</a>
      </h1>
      <h2 className="text-sm text-center pb-4">
        What has been seen cannot be unseen :)
      </h2>
      <main className="mx-auto w-screen">
        {dataState.map((c, index) => Card(c, index))}
      </main>
      <div className="justify-center text-center pb-3">
        <LoadMoreButton isLoaded={allLoaded} handler={handleButtonClick} />
      </div>

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
    </div>
  );
}

export default Home;

export const getServerSideProps: GetServerSideProps = async ctx => {
  const data = await getLatestDiffs(10, 0);
  return { props: { data: data.data } };
};
