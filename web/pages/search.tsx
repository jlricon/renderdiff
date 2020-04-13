import { DiffBunch, Diff, stringToDateBunch, getDiffsForTwo } from "../lib/lib";
import Card from "../components/Card";
import { GetServerSideProps } from "next";
import Dashboard from "../components/Dashboard";
import { Footer } from "../components/Footer";
import auth0 from "../lib/auth0";
interface Props {
  data: DiffBunch<number>;
  isLoggedIn: boolean;
}
function Search({ data, isLoggedIn }: Props) {
  return (
    <Dashboard isLoggedIn={isLoggedIn}>
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
  const diffBunch = getDiffsForTwo(
    url as string,
    parseInt(rev1 as string),
    parseInt(rev2 as string)
  ).then((data) => {
    return {
      url: url as string,
      last_revision: parseInt(rev2 as string),
      prev_revision: parseInt(rev1 as string),
      date_seen1: data.date_rev1,
      date_seen2: data.date_rev2,
      diff: data.diffs,
    };
  });
  // const diffBunch: DiffBunch<number> = ;
  const isLoggedIn = auth0.getSession(ctx.req).then((ses) => {
    if (ses) {
      return true;
    } else {
      return false;
    }
  });
  return { props: { data: await diffBunch, isLoggedIn: await isLoggedIn } };
};
