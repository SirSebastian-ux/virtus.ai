/**
 * Self-reported behavioral development summaries.
 * Never interprets ratings as diagnostic or clinical scores.
 */
function numberRating(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}
export function longitudinalGoalSummary(goal, records = []) {
  const baseline = numberRating(goal?.baseline_rating);
  const relevant = (Array.isArray(records) ? records : [])
    .filter((r) => r?.goal_id === goal?.id && numberRating(r?.rating) !== null)
    .sort((a, b) => Date.parse(a.created_at || 0) - Date.parse(b.created_at || 0));
  const trajectory = [
    ...(baseline !== null ? [{ date: goal.created_at, rating: baseline, kind: "baseline" }] : []),
    ...relevant.map((r) => ({
      date: r.created_at,
      rating: numberRating(r.rating),
      kind: "self_report",
      hasBehaviorEvidence: typeof r.evidence === "string" && r.evidence.trim().length >= 10,
    })),
  ];
  const latest = relevant.length ? numberRating(relevant[relevant.length-1].rating) : baseline;
  const change = baseline === null || latest === null ? null : latest - baseline;
  const period = Math.max(0, Number(goal?.program_days) || 0);
  const completion = period > 0 ? Math.min(100, Math.round(relevant.length * 100 / period)) : 0;
  const evidenceCount = relevant.filter(r => typeof r.evidence === "string" && r.evidence.trim().length >= 10).length;
  const distinctDays = new Set(relevant.map(r => String(r.created_at || "").slice(0,10))).size;
  const lastThree = relevant.slice(-3).map(r => numberRating(r.rating));
  const recentAverage = lastThree.length
    ? Math.round(lastThree.reduce((a,b) => a+b,0) / lastThree.length * 10) / 10 : null;
  return {
    baseline, latest, change, completedCheckins: relevant.length,
    programmeDays: period, completion, evidenceCount, distinctDays,
    recentAverage, trajectory,
    source: "client_self_report",
    disclosure: "Self-report is not independently verified behavioral improvement or a clinical measure.",
  };
}
export function summarizeDevelopmentPortfolio(goals = [], checkins = []) {
  const list = (Array.isArray(goals) ? goals : []).map(goal => ({
    id: goal.id, title: goal.title, domain: goal.focus_domain, status: goal.status,
    ...longitudinalGoalSummary(goal, checkins),
  }));
  return {
    goals: list,
    activeCount: list.filter(g => g.status === "active").length,
    completedCount: list.filter(g => g.status === "completed").length,
    totalCheckins: list.reduce((sum,g) => sum + g.completedCheckins,0),
    totalBehaviorReports: list.reduce((sum,g) => sum + g.evidenceCount,0),
    label: "Client-reported practice activity, not clinical outcomes",
  };
}
