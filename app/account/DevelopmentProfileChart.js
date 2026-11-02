"use client";

import { COACHING_SKILLS, DIRECTION_LABELS, getTrendPoints } from "@/lib/virtus-coaching-history.mjs";

const AXIS = [
  { label: "Signs of progress", y: 76 },
  { label: "Consistent patterns", y: 143 },
  { label: "Needs attention", y: 210 },
];
const PALETTE = {
  improving: "#42c49d",
  stable: "#e4bd79",
  declining: "#d6917d",
};
const SHORT_LABELS = [
  ["Self-", "awareness"],
  ["Emotional", "regulation"],
  ["Critical", "thinking"],
  ["Meta-", "cognition"],
  ["Account-", "ability"],
  ["Communi-", "cation"],
];
const BASELINE_Y = 250;
const xFor = (index) => 205 + index * 125;
const barTop = (band) => (band === 2 ? 76 : band === 1 ? 143 : 210);

function formatDate(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function DevelopmentProfileChart({ reviews, periods }) {
  const historical = Array.isArray(periods) ? periods : [];
  const comparison = historical.length >= 2;
  const first = historical[0];
  const last = historical.at(-1);
  const series = COACHING_SKILLS.map((skill) => {
    const points = getTrendPoints(reviews, skill);
    return {
      skill,
      earlier: comparison ? points[0] : null,
      latest: points.at(-1) || null,
    };
  });

  return (
    <section className="virtus-profile-chart mt-6 overflow-hidden rounded-2xl border border-[#dfba78]/35 bg-[#061e1b] p-4 sm:p-6" aria-labelledby="virtus-profile-chart-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e0bc7a]">Coaching intelligence</p>
          <h4 id="virtus-profile-chart-title" className="mt-2 font-serif text-2xl text-[#f8e8ca]">Development profile</h4>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c5d5cb]">
            {comparison
              ? "An at-a-glance comparison of the first and most recent AI coaching classifications across six development areas."
              : "A snapshot of six development areas from the latest available coaching review."}
          </p>
        </div>
        <div className="shrink-0 rounded-full border border-[#dfba78]/40 bg-[#124438] px-3 py-1.5 text-xs font-medium text-[#eed097]">
          {comparison ? "Two review periods" : "Baseline snapshot"}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#d6ded5]" aria-label="Chart legend">
        {comparison && <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-[#66877a]" aria-hidden="true" />First review</span>}
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-[#dfba78]" aria-hidden="true" />{comparison ? "Latest review" : "Current review"}</span>
        <span className="text-[#a9bdb4]">Column height represents an observation category, not a score.</span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[#bb9458]/20 bg-[#041614] p-3 [scrollbar-color:#b48a52_#0b2c27]">
        <svg viewBox="0 0 940 316" className="h-auto min-w-[670px] w-full" role="img" aria-labelledby="virtus-chart-svg-title virtus-chart-svg-desc">
          <title id="virtus-chart-svg-title">Six-domain qualitative coaching profile</title>
          <desc id="virtus-chart-svg-desc">Grouped vertical bars for the six coaching areas, with three categorical levels. When two distinct review periods are available, an earlier bar is placed next to the latest review. Missing observations have no bar.</desc>
          <defs>
            <linearGradient id="virtus-development-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f2d69a" stopOpacity=".95" />
              <stop offset="100%" stopColor="#977146" stopOpacity=".86" />
            </linearGradient>
          </defs>
          {AXIS.map((axis, index) => (
            <g key={axis.label}>
              <line x1="139" x2="913" y1={axis.y} y2={axis.y} stroke="#43665a" strokeOpacity={index === 1 ? ".66" : ".5"} strokeWidth="1" strokeDasharray="4 6" />
              <text x="126" y={axis.y + 4} fill="#c4d7ca" textAnchor="end" fontSize="13" fontFamily="system-ui, sans-serif">{axis.label}</text>
            </g>
          ))}
          <line x1="139" x2="913" y1={BASELINE_Y} y2={BASELINE_Y} stroke="#bf975c" strokeOpacity=".55" />
          {series.map((entry, index) => {
            const center = xFor(index);
            const choices = comparison
              ? [{ point: entry.earlier, earlier: true }, { point: entry.latest, earlier: false }]
              : [{ point: entry.latest, earlier: false }];
            return (
              <g key={entry.skill}>
                {choices.map(({ point, earlier }) => {
                  const offset = comparison ? (earlier ? -18 : 18) : 0;
                  const width = comparison ? 27 : 40;
                  const x = center + offset - width / 2;
                  const top = point?.band === null || point?.band === undefined ? null : barTop(point.band);
                  const color = earlier ? "#648879" : PALETTE[point.direction] || "#dfba78";
                  const key = earlier ? "first" : "latest";
                  return top !== null ? (
                    <g key={key}>
                      <rect x={x} y={top} width={width} height={BASELINE_Y - top} rx="6" fill={color} fillOpacity={earlier ? ".55" : ".92"} stroke={earlier ? "#a2c1ad" : "#f0d6ab"} strokeOpacity=".46" strokeWidth=".9">
                        <title>{entry.skill} · {earlier ? "First" : "Latest"} · {DIRECTION_LABELS[point.direction]} · {formatDate(point.date)} · {point.confidence} confidence</title>
                      </rect>
                      <line x1={x + 4} x2={x + width - 4} y1={top + 3} y2={top + 3} stroke="#f8f3dc" strokeOpacity=".46" strokeWidth="1.3" />
                    </g>
                  ) : (
                    <g key={key}>
                      <rect x={x} y={225} width={width} height={25} rx="5" fill="none" stroke="#78978d" strokeDasharray="3 3" strokeOpacity=".75" />
                      <text x={x + width / 2} y="240" fill="#b2c6bd" textAnchor="middle" fontSize="9" fontFamily="system-ui, sans-serif">N/A</text>
                      <title>{entry.skill}: insufficient evidence</title>
                    </g>
                  );
                })}
                <text x={center} y="280" textAnchor="middle" fill="#f0e8d8" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif">
                  <tspan x={center}>{SHORT_LABELS[index][0]}</tspan>
                  <tspan x={center} dy="16">{SHORT_LABELS[index][1]}</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[#c5d5cb]">
        <span>{first ? "First review: " + formatDate(first.created_at) : "No review"}</span>
        {comparison && <span>Latest review: {formatDate(last.created_at)}</span>}
      </div>
      <p className="mt-4 rounded-xl border border-[#cfaa68]/25 bg-[#0b3028] p-3 text-sm leading-6 text-[#e2d5bb]">
        {comparison
          ? "Column differences are changes in the AI's qualitative interpretation, not measured increases or decreases in psychological ability."
          : "One review is a baseline, not an improvement trend. A comparison will appear when a later review covers a different evidence period."}
      </p>
      <p className="mt-3 text-xs leading-5 text-[#9fb8ab]">
        N/A means insufficient evidence. Review descriptions and confidence levels below provide the context behind each classification.
      </p>
    </section>
  );
}
