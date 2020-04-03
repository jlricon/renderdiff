export const LoadMoreButton = ({ isLoaded, handler }: LoadMoreInterface) => {
  const commonCss =
    "bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow w-64";
  if (!isLoaded) {
    return (
      <button className={commonCss} onClick={(event) => handler(5)}>
        Load 5 more
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
interface LoadMoreInterface {
  isLoaded: boolean;
  handler: (n: number) => Promise<void>;
}
