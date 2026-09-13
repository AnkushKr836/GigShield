"use client";

export default function Gauge({ percent = 0, value = "—", label = "COVERAGE", status = "neutral" }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const cx = 100, cy = 100, r = 78;
  const startAngle = 180;

  const toPoint = (angleDeg, radius = r) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  const arcPath = (fromDeg, toDeg) => {
    const start = toPoint(fromDeg);
    const end = toPoint(toDeg);
    const largeArc = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const sweptAngle = startAngle - (clamped / 100) * 180;
  const needle = toPoint(sweptAngle, 63);
  const statusColor = {
    safe: "#14B8A6",
    attention: "#F0A93B",
    danger: "#EF5B72",
    neutral: "#1690E0",
  }[status] || "#1690E0";

  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 122" className="w-full max-w-[260px] overflow-visible" role="img" aria-label={`${label}: ${value}`}>
        <defs>
          <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={arcPath(180, 0)} fill="none" stroke="rgba(15,42,67,0.10)" strokeWidth="13" strokeLinecap="round" />
        <path d={arcPath(180, sweptAngle)} fill="none" stroke={statusColor} strokeWidth="13" strokeLinecap="round" filter="url(#gaugeGlow)" />

        {ticks.map((t) => {
          const angle = 180 - (t / 100) * 180;
          const outer = toPoint(angle);
          const inner = toPoint(angle, r - 16);
          return <line key={t} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="currentColor" className="text-ink" strokeOpacity=".16" strokeWidth="2" />;
        })}

        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="currentColor" className="text-ink" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="7" fill={statusColor} opacity=".16" />
        <circle cx={cx} cy={cy} r="4" fill="currentColor" className="text-ink" />

        <text x={cx} y={cy - 25} textAnchor="middle" className="font-mono font-semibold text-ink" style={{ fontSize: "22px" }}>
          {value}
        </text>
        <text x={cx} y={cy - 7} textAnchor="middle" className="font-body text-muted" style={{ fontSize: "9px", letterSpacing: "0.12em" }}>
          {label}
        </text>
      </svg>
      <div className="h-1 w-14 rounded-full mt-[-2px]" style={{ backgroundColor: statusColor, opacity: .75 }} />
    </div>
  );
}
