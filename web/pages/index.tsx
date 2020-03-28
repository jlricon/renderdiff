import Head from "next/head";
import { getLatestDiffs, DiffDict } from "../lib/lib";

const Home = ({ data, url_ }) => (
  <div
    className="flex flex-col bg-gray-100 h-screen w-cover"
    style={{ minHeight: "100vh" }}
  >
    <Head>
      <title>Commitment</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <div className="mx-auto">
      <h1 className="font-bold  text-4xl md:text-6xl text-center text-gray-800">
        <a>Commitment</a>
      </h1>
      <h2 className="text-sm text-center pb-4">
        What has been seen cannot be unseen :)
      </h2>
      {/* Main */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg ml-10 mr-10 max-w-6xl">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Last updated: 2020-01-01
          </h3>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            From{" "}
            <a className="hover:text-teal-300" href={url_}>
              {url_}
            </a>
          </p>
        </div>

        <div className="bg-gray-50 px-4 py-5 sm:gap-4 sm:px-6 text-sm text-justify">
          {data.map((e, index) => coloredDiff(e, index))}
        </div>
      </div>
      <div className="justify-center text-center pb-10">
        <a
          className="pl-2 hover:text-teal-300 font-medium text-lg"
          href="https://twitter.com/ArtirKel"
        >
          A public service by Jose Luis Ricon
        </a>{" "}
        (
        <a className="hover:text-teal-300" href="mailto:jose@ricon.xyz">
          email
        </a>
        )
      </div>
    </div>
  </div>
);

export default Home;

Home.getInitialProps = async ctx => {
  const url =
    "https://www.vox.com/coronavirus-covid19/2020/3/27/21195162/new-york-coronavirus-news-andrew-cuomo-hospitals-population-ventilators";
  const data = await getLatestDiffs(url, 1, 4);
  return { data: data.data, url_: url };
};
function coloredDiff(diff: DiffDict, index: number) {
  if ("Equal" in diff) {
    return (
      <span className="font-hairline" key={index}>
        {diff["Equal"].slice(0, 30) +
          "[...]" +
          diff["Equal"].slice(diff["Equal"].length - 30, diff["Equal"].length)}
      </span>
    );
  }
  if ("Delete" in diff) {
    return (
      <span className="text-red-600 font-medium text-lg" key={index}>
        {diff["Delete"]}
      </span>
    );
  }
  if ("Insert" in diff) {
    return (
      <span className="text-green-600 font-medium text-lg" key={index}>
        {diff["Insert"]}
      </span>
    );
  }
}
