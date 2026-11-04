// Lightweight bar chart built with plain HTML/CSS
export default function BarChart({ data = [], format = (v) => v, height = 180, labelEvery = 1, max: maxProp, suffix = '' }) {
  const max = maxProp || Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="barchart" style={{ '--chart-h': `${height}px` }}>
      <div className="barchart-bars">
        {data.map((d, i) => (
          <div className="barchart-col" key={d.label + i} title={`${d.label}: ${format(d.value)}${suffix}`}>
            <div className="barchart-bar" style={{ height: `${(d.value / max) * 100}%` }} />
            <span className="barchart-x">{i % labelEvery === 0 ? d.short || d.label : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Horizontal bars, good for categories
export function HBarChart({ data = [], format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="hbars">
      {data.map((d) => (
        <li key={d.label}>
          <span className="hbars-label">{d.label}</span>
          <span className="hbars-track">
            <span className="hbars-fill" style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="hbars-value">{format(d.value)}</span>
        </li>
      ))}
    </ul>
  );
}
