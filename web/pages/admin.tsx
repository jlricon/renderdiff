import Dashboard from "../components/Dashboard";
import fetch from "isomorphic-unfetch";
import { NextPageContext } from "next";
import auth0 from "../lib/auth0";
import { IncomingMessage } from "http";
interface Props {
  isAuthed: boolean;
}
function AdminDashboard() {
  return <div>The admin dashboard</div>;
}
function renderAdmin(isAuthed: boolean) {
  if (!isAuthed) {
    return <p>You are not authenticated :(</p>;
  } else {
    return <AdminDashboard />;
  }
}
function Home({ isAuthed }: Props) {
  return (
    <Dashboard isLoggedIn={isAuthed} isLoading={false}>
      {renderAdmin(isAuthed)}
    </Dashboard>
  );
}

export default Home;

export async function getServerSideProps(ctx: NextPageContext) {
  if (typeof window === "undefined") {
    const ses = await auth0.getSession(ctx.req as IncomingMessage);

    const user = ses?.user;

    if (!user) {
      // @ts-ignore
      ctx.res.writeHead(302, {
        Location: "/api/login",
      });
      // @ts-ignore
      ctx.res.end();
      return;
    }
    const user_id: string | undefined = user?.sub;
    const resp = await fetch(
      `${process.env.AUTH0_HOST}/api/v2/users/${user_id}/roles`,
      {
        headers: {
          authorization: `Bearer ${process.env.AUTH0_BEARER}`,
        },
      }
    ).then((e) => e.json());
    const roles = resp.map((i: { name: string }) => i.name);
    const isAdmin = roles.includes("Admin");
    return { props: { isAuthed: isAdmin } };
  }
}
