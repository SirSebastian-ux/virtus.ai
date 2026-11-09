"use client";
import { useEffect, useMemo, useState } from "react";
import { buildDevelopmentIndex } from "@/lib/virtus-development-index.mjs";

const colors = ["#e8c27e", "#4ed3bb", "#9bd6e7", "#d7a4e7", "#f4a8a1", "#9cd4a5", "#a6b9f0"];
export default function UniversalDevelopmentDashboard({ plan = "free" }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("All domains");
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/account/coaching-history", { cache: "no-store" });
        if (!response.ok) throw new Error("Development history is temporarily unavailable.");
        const data = await response.json();
        if (active) setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    };
    load();
    window.addEventListener("virtus-coaching-review-saved", load);
    return () => { active = false; window.removeEventListener("virtus-coaching-review-saved", load); };
  }, []);
  const domains = useMemo(() => buildDevelopmentIndex(reviews), [reviews]);
  const tier = plan === "premium" ? "Mentor" : plan === "plus" ? "Trainer" : plan === "life_coach" ? "Life Coach" : "Trial / Free";
  const measured = domains.filter((d) => d.value !== null);
  const visible = selected === "All domains" ? domains : domains.filter((d) => d.name === selected);
  const maxPoints = Math.max(2, ...visible.map((d) => d.history.length));
  const x = (i) => 56 + (i / (maxPoints - 1)) * 650;
  const y = (v) => 248 - (v / 100) * 204;
  const radarPoints = (value) => domains.map((d, i) => {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 7;
    const r = (value === null ? 0 : value) * 1.05;
    return [150 + Math.cos(angle) * r, 138 + Math.sin(angle) * r];
  });
  return (
    <section className="rounded-2xl border border-[#d8bd85]/40 bg-[#092b25] p-4 text-[#f7ebd5] sm:p-6" aria-label="Your seven-domain development dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e4bd79]">Virtus development intelligence</p><h3 className="mt-2 font-serif text-3xl">My Development Dashboard</h3><p className="mt-2 text-sm text-[#c6d5ce]">Seven individual development trajectories based on recorded coaching evidence.</p></div>
        <span className="rounded-full border border-[#d8bd85]/50 bg-[#15473a] px-4 py-2 text-sm text-[#e4bd79]">{tier} · {measured.length}/7 domains observed</span>
      </div>
      {loading && <p className="mt-4 text-sm">Loading development evidence...</p>}
      {error && <p role="alert" className="mt-4 text-sm text-amber-200">{error}</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {domains.map((domain, i) => <div key={domain.name} className="rounded-xl border border-[#c6a56d]/35 bg-[#0e3a30] p-4">
          <p className="text-sm font-semibold">{domain.name}</p>
          <p className="mt-2 text-3xl font-semibold" style={{ color: colors[i] }}>{domain.value === null ? "—" : domain.value + "%"}</p>
          <p className="mt-1 text-xs text-[#d3e2d9]">{domain.value === null ? "Awaiting evidence" : domain.delta === null ? "Initial evidence index" : domain.delta > 0 ? "+" + domain.delta + " points since first review" : domain.delta < 0 ? domain.delta + " points since first review" : "No index change"}</p>
          <div className="mt-4 h-2 rounded-full bg-[#42675b]"><div className="h-full rounded-full transition-all" style={{ width: (domain.value || 0) + "%", background: colors[i] }} /></div>
          <p className="mt-2 text-xs text-[#c4d3cc]">{domain.count} independent review {domain.count === 1 ? "period" : "periods"}</p>
        </div>)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-[#c6a56d]/35 bg-[#06241f] p-4">
          <h4 className="font-serif text-xl text-[#e8c27e]">Development trajectory</h4>
          <p className="mt-1 text-xs text-[#bdd6cd]">Evidence index over distinct review periods; no fabricated historical scores.</p>
          <div className="mt-3 flex flex-wrap gap-2">{["All domains", ...domains.map((d) => d.name)].map((name) => <button key={name} type="button" onClick={() => setSelected(name)} className={"rounded-lg border px-2.5 py-1.5 text-xs " + (selected === name ? "border-[#e8c27e] bg-[#e8c27e] text-[#092b25]" : "border-[#c6a56d]/50 text-[#e8c27e]")}>{name}</button>)}</div>
          <svg viewBox="0 0 760 290" className="mt-3 w-full" role="img" aria-label="Individual development index trajectory chart">
            {[0,25,50,75,100].map((n) => <g key={n}><line x1="55" x2="720" y1={y(n)} y2={y(n)} stroke="#456a61" strokeDasharray="4 6"/><text x="12" y={y(n)+4} fontSize="12" fill="#bdd6cd">{n}%</text></g>)}
            {visible.map((domain) => {
              const i = domains.indexOf(domain);
              return <g key={domain.name}>{domain.history.length > 1 && <polyline fill="none" stroke={colors[i]} strokeWidth="3" points={domain.history.map((p,j) => x(j)+","+y(p.value)).join(" ")}/>}
                {domain.history.map((p,j) => <circle key={j} cx={x(j)} cy={y(p.value)} r="5" fill={colors[i]}><title>{domain.name}: {p.value}% index · {p.direction} · {p.confidence} confidence</title></circle>)}</g>;
            })}
            <text x="55" y="277" fill="#bdd6cd" fontSize="12">First review</text><text x="650" y="277" fill="#bdd6cd" fontSize="12">Latest</text>
            {!measured.length && <text x="380" y="140" textAnchor="middle" fill="#e8c27e" fontSize="16">Awaiting recorded coaching evidence</text>}
          </svg>
          <div className="flex flex-wrap gap-3">{visible.map((d) => <span key={d.name} className="flex items-center gap-1.5 text-xs text-[#c6d5ce]"><span className="h-2 w-2 rounded-full" style={{background:colors[domains.indexOf(d)]}}/>{d.name}</span>)}</div>
        </div>
        <div className="rounded-xl border border-[#c6a56d]/35 bg-[#06241f] p-4">
          <h4 className="font-serif text-xl text-[#e8c27e]">Development profile</h4>
          <p className="mt-1 text-xs text-[#bdd6cd]">Seven independent evidence indicators</p>
          <svg viewBox="0 0 300 285" className="mx-auto mt-3 w-full max-w-[350px]" role="img" aria-label="Seven-domain radar chart">
            {[25,50,75,100].map((level) => <polygon key={level} points={radarPoints(level).map((p)=>p.join(",")).join(" ")} fill="none" stroke="#42675b" strokeWidth="1"/>)}
            {domains.map((d,i) => <line key={d.name} x1="150" y1="138" x2={radarPoints(100)[i][0]} y2={radarPoints(100)[i][1]} stroke="#42675b"/>)}
            {measured.length > 0 && <polygon points={radarPoints(null).map((p,i) => (domains[i].value === null ? p : radarPoints(domains[i].value)[i]).join(",")).join(" ")} fill="#e8c27e" fillOpacity=".15" stroke="#e8c27e" strokeWidth="2"/>}
            {domains.map((d,i) => {const p=radarPoints(120)[i];return <text key={d.name} x={p[0]} y={p[1]} textAnchor="middle" fontSize="9" fill="#d6e3dc">{d.name.split(" ").map((word,j)=><tspan key={j} x={p[0]} dy={j ? 10 : 0}>{word}</tspan>)}</text>;})}
            {!measured.length && <text x="150" y="143" textAnchor="middle" fill="#e8c27e" fontSize="13">Awaiting evidence</text>}
          </svg>
          <p className="text-center text-sm text-[#d8bd85]">{measured.length} of 7 domains observed</p>
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-[#c4d3cc]">Percentages are a directional coaching evidence index, not measured intelligence, clinical assessments, or verified workplace performance. The first observation anchors each domain at a neutral 50%; later independent reviews change the index by up to 8 points according to observed direction and confidence. Missing evidence is unscored. Repeated reviews of the same conversation window do not create additional progress. Private observations are not employer reporting data.</p>
      <p className="mt-2 text-xs text-[#e4bd79]">{tier === "Mentor" ? "Mentor: full coaching reviews and adaptive development." : tier === "Trainer" ? "Trainer: guided practice and development comparisons." : tier === "Life Coach" ? "Life Coach: personal reflection and development overview." : "Your development overview is available; coaching and training access depend on membership."}</p>
    </section>
  );
}
