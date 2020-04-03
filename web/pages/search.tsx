import { DiffBunch, Diff, stringToDateBunch, getDiffsForTwo } from "../lib/lib";
import Card from "../components/Card";
import { GetServerSideProps } from "next";
import Dashboard from "../components/Dashboard";
import { Footer } from "../components/Footer";
interface Props {
  data: DiffBunch<number>;
}
function Search({ data }: Props) {
  return (
    <Dashboard>
      <div
        className="flex flex-col h-cover w-cover"
        // style={{ minHeight: "100vh", minWidth: "fit-content" }}
      >
        <div className="mx-auto">
          <main>
            <Card data={stringToDateBunch(data)} />
          </main>

          <Footer />
        </div>
      </div>
    </Dashboard>
  );
}

export default Search;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { url, rev1, rev2 } = ctx.query;
  const data = await getDiffsForTwo(
    url as string,
    parseInt(rev1 as string),
    parseInt(rev2 as string)
  );
  const diffBunch: DiffBunch<number> = {
    url: url as string,
    last_revision: parseInt(rev2 as string),
    prev_revision: parseInt(rev1 as string),
    date_seen1: data.date_rev1,
    date_seen2: data.date_rev2,
    diff: data.diff,
  };

  return { props: { data: diffBunch } };
};
