import { Range } from "rc-slider";
import "rc-slider/assets/index.css";
const st = { width: 100, margin: 0 };
interface Props {
  rev1: number;
  rev2: number;
  updateHandler: (rev1: number, rev2: number) => Promise<void>;
  lastRevision: number;
}

export const RevisionButton = ({
  rev1,
  rev2,
  updateHandler,
  lastRevision
}: Props) => {
  const marks = Array.from(Array(lastRevision).keys()).reduce((acc, elem) => {
    // @ts-ignore
    acc[`${elem + 1}`] = elem + 1;
    return acc;
  }, {});

  return (
    <div style={st} className="pb-4 flex-col">
      <p className="pb-2 text-center">Revision</p>
      <Range
        allowCross={false}
        min={1}
        max={lastRevision}
        defaultValue={[rev1, rev2]}
        marks={marks}
        onAfterChange={(event: [number, number]) => {
          const minRev = Math.min(event[0], event[1]);
          const maxRev = Math.max(event[0], event[1]);
          updateHandler(minRev, maxRev);
        }}
      />
    </div>
  );
};

export default RevisionButton;
