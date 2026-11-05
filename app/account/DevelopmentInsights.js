"use client";
import { summarizeDevelopmentPortfolio } from "@/lib/virtus-longitudinal.mjs";

function Trend({ points }) {
  if (!points?.length) return null;
  const shown = points.slice(-16);
  const width = 280, height = 75, pad = 11;
  const coords = shown.map((p, i) => {
    const x = shown.length === 1 ? width / 2 : pad + i * (width - 2 * pad) / (shown.length - 1);
    const y = height - pad - (p.rating - 1) * ((height - 2 * pad) / 4);
    return [x, y];
  });
  return <svg viewBox="0 0 280 75" className="h-20 w-full max-w-[350px]" role="img" aria-label="Client self-rated development over time from one to five">
    {[1,2,3,4,5].map(n => <line key={n} x1="10" x2="270" y1={height-pad-(n-1)*((height-2*pad)/4)} y2={height-pad-(n-1)*((height-2*pad)/4)}
      stroke="#51756a" strokeWidth="0.6" />)}
    <polyline points={coords.map(([x,y])=>`${x},${y}`).join(" ")} fill="none" stroke="#e2c281" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    {coords.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3.1" fill={i ? "#e2c281" : "#fff6dc"} />)}
  </svg>;
}
export default function DevelopmentInsights({ goals = [], checkins = [] }) {
  const portfolio = summarizeDevelopmentPortfolio(goals,checkins);
  if (!goals.length) return null;
  return (
    <section className="mt-6 rounded-2xl border border-[#d8bd85]/35 bg-[#071d1c]/80 p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8bd85]">Longitudinal Development Intelligence</p>
      <h3 className="mt-2 font-serif text-xl text-[#f4e5bf]">Your documented progress</h3>
      <p className="mt-2 text-sm leading-6 text-[#c7d9cc]">This review reflects your own ratings and recorded behavior. A higher number is not proof of clinical improvement.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Active goals",portfolio.activeCount],["Completed goals",portfolio.completedCount],
          ["Practice entries",portfolio.totalCheckins],["Evidence reports",portfolio.totalBehaviorReports]
        ].map(([label,value])=><div key={label} className="rounded-xl border border-[#a68b5c]/40 bg-[#103c32] p-3">
          <p className="text-xs text-[#d4ddce]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#f4dfa8]">{value}</p>
        </div>)}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {portfolio.goals.map(goal => (
          <article key={goal.id} className="rounded-xl border border-[#8e8260]/40 bg-[#0e3129] p-4">
            <h4 className="text-sm font-semibold text-white">{goal.title}</h4>
            <p className="mt-1 text-xs text-[#c8d6c7]">{goal.completedCheckins}/{goal.programmeDays} practice days · {goal.completion}% complete</p>
            <Trend points={goal.trajectory} />
            <p className="text-sm text-[#e2d8b5]">Self-rating: {goal.baseline ?? "—"} → {goal.latest ?? "—"} / 5
              {goal.change !== null ? ` (${goal.change > 0 ? "+" : ""}${goal.change})` : ""}
            </p>
            <p className="mt-1 text-xs text-[#bcd1c3]">{goal.evidenceCount} documented observations · {goal.distinctDays} distinct check-in dates
            {goal.recentAverage !== null ? ` · recent three average: ${goal.recentAverage}/5` : ""}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
