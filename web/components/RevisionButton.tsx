import { Range } from "rc-slider";
import "rc-slider/assets/index.css";
const st = { width: 100, margin: 0 };
interface Props {
  rev1: number;
  rev2: number;
}

export const RevisionButton = ({ rev1, rev2 }: Props) => {
  const marks = Array.from(Array(rev2).keys()).reduce((acc, elem) => {
    acc[`${elem + 1}`] = elem + 1;
    return acc;
  }, {});

  return (
    <div style={st} className="pb-4 flex-col">
      <p className="pb-2 text-center">Revision</p>
      <Range min={1} max={rev2} defaultValue={[rev1, rev2]} marks={marks} />
    </div>
  );
};

export default RevisionButton;
