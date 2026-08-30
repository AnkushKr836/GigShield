"use client";

/**
 * The Coverage Barometer — GigShield's signature visual element.
 * A weather-barometer-style arc gauge, deliberately chosen because the product's
 * entire premise is weather/disruption-triggered protection for people who read
 * gauges on the move (speedometers, fuel gauges) rather than dashboards at a desk.
 *
 * percent: 0-100, how much of the current policy week remains
 * status: "safe" | "signal" | "danger" | "neutral" — drives the arc color
 */
export default function Gauge({ percent = 0, value = "—", label = "COVERAGE", status = "neutral" }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const cx = 100;
  const cy = 100;
  const r = 78;
  const startAngle = 180; // left
  const endAngle = 0; // right, sweeping over the top

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
    safe: "#2F7D5C",
    signal: "#E8871E",
    danger: "#B3432B",
    neutral: "#48566B",
  }[status];

  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-[240px]" role="img" aria-label={`${label}: ${value}`}>
        <path d={arcPath(180, 0)} fill="none" stroke="#C9D2DB" strokeWidth="12" strokeLinecap="round" />
        <path d={arcPath(180, sweptAngle)} fill="none" stroke={statusColor} strokeWidth="12" strokeLinecap="round" />

        {ticks.map((t) => {
          const angle = 180 - (t / 100) * 180;
          const outer = toPoint(angle);
          const inner = { x: cx + (r - 16) * Math.cos((angle * Math.PI) / 180), y: cy - (r - 16) * Math.sin((angle * Math.PI) / 180) };
          return (
            <line
              key={t}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#1B2430"
              strokeOpacity="0.15"
              strokeWidth="2"
            />
          );
        })}

        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#1B2430" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#1B2430" />

        <text
          x={cx}
          y={cy - 26}
          textAnchor="middle"
          className="font-mono font-semibold"
          style={{ fontSize: "22px", fill: "#1B2430" }}
        >
          {value}
        </text>
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="font-body"
          style={{ fontSize: "9px", letterSpacing: "0.12em", fill: "#48566B" }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
