"use client";

export default function Gauge({ percent = 0, value = "—", label = "COVERAGE", status = "neutral" }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const cx = 100;
  const cy = 100;
  const r = 78;
  const startAngle = 180;

  const toPoint = (angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };

  const arcPath = (fromDeg, toDeg) => {
    const start = toPoint(fromDeg);
    const end = toPoint(toDeg);
    const largeArc = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const sweptAngle = startAngle - (clamped / 100) * 180;
  const needle = toPoint(sweptAngle);

  const statusColor = {
    safe: "#14B8A6",
    attention: "#F0A93B",
    danger: "#EF5B72",
    neutral: "#1690E0",
  }[status];

  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-[240px]" role="img" aria-label={`${label}: ${value}`}>
        <path d={arcPath(180, 0)} fill="none" stroke="rgba(15,42,67,0.1)" strokeWidth="12" strokeLinecap="round" />
        <path d={arcPath(180, sweptAngle)} fill="none" stroke={statusColor} strokeWidth="12" strokeLinecap="round" />

        {ticks.map((t) => {
          const angle = 180 - (t / 100) * 180;
          const outer = toPoint(angle);
          const inner = { x: cx + (r - 16) * Math.cos((angle * Math.PI) / 180), y: cy - (r - 16) * Math.sin((angle * Math.PI) / 180) };
          return (
            <line key={t} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#0F2A43" strokeOpacity="0.12" strokeWidth="2" />
          );
        })}

        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#0F2A43" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#0F2A43" />

        <text x={cx} y={cy - 26} textAnchor="middle" className="font-mono font-semibold" style={{ fontSize: "22px", fill: "#0F2A43" }}>
          {value}
        </text>
        <text x={cx} y={cy - 8} textAnchor="middle" className="font-body" style={{ fontSize: "9px", letterSpacing: "0.12em", fill: "#4C7089" }}>
          {label}
        </text>
      </svg>
    </div>
  );
}
