// Decorative 70s pieces: rainbow wave stripes and a spinning text ring.

const WAVE = "M0 30 C 120 6, 240 6, 360 30 S 600 54, 720 30 S 960 6, 1080 30 S 1320 54, 1440 30";
const STRIPES = ["var(--mustard)", "var(--orange)", "var(--pink)", "var(--purple)"];

export function Stripes({ flip }: { flip?: boolean }) {
  return (
    <svg className={`stripes ${flip ? "stripes-flip" : ""}`} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
      {STRIPES.map((c, i) => (
        <path key={c} d={WAVE} transform={`translate(0 ${18 + i * 20})`} fill="none" stroke={c} strokeWidth="21" />
      ))}
    </svg>
  );
}

export function SpinRing({ text }: { text: string }) {
  return (
    <svg className="spin-ring" viewBox="0 0 200 200" aria-hidden>
      <defs>
        <path id="ring-path" d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0" />
      </defs>
      <text>
        <textPath href="#ring-path" textLength="535">{text}</textPath>
      </text>
    </svg>
  );
}
