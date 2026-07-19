export default function RingProgress({ percent }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  const color = percent === 100 ? "var(--green)" : "var(--gold-500)";
  return (
    <div className="ring-progress">
      <svg width="46" height="46">
        <circle cx="23" cy="23" r={r} stroke="#E1E6EC" strokeWidth="4" fill="none" />
        <circle
          cx="23"
          cy="23"
          r={r}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
        />
      </svg>
      <div className="pct">{percent}%</div>
    </div>
  );
}
