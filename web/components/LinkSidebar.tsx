import Link from "next/link";

const LinkSidebar = ({ sites }: { sites: string[] }) => {
  return (
    <div className=" hidden md:block ">
      <h2 className="text-center mb-3 lg:mb-2 text-gray-500 uppercase tracking-wide font-bold text-sm lg:text-xs">
        Sites available
      </h2>
      <ul>
        {sites.map((c) => (
          <Link href="/site/[site]" as={`/site/${c}`} key={c}>
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
  );
};
export default LinkSidebar;
