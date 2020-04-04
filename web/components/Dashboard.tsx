import Head from "next/head";
import Link from "next/link";
import ReactGA from "react-ga";
import { useEffect } from "react";
function initGa() {
  ReactGA.initialize("UA-4255500-4");
  ReactGA.pageview(window.location.pathname + window.location.search);
}
interface Props {}
function Dashboard({ children }: React.PropsWithChildren<Props>) {
  useEffect(() => {
    initGa();
  }, []);
  return (
    <>
      <Head>
        <title>Commitment</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <nav className="bg-gray-800 sticky top-0 z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-8"
                  src="/logo.svg"
                  alt="Commitment logo"
                />
              </div>
              <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold leading-tight text-teal-200">
                  <Link href="/">
                    <a>Commitment</a>
                  </Link>
                </h1>
              </div>
              {/* <h2 className="text-sm text-center text-teal-300 align-baseline">
                  What has been seen cannot be unseen :)
                </h2> */}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </>
  );
}
export default Dashboard;
