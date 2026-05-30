import { requireAdminPage } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

async function getGlobalLearningReport() {
  await requireAdminPage();

  const admin = createAdminClient();



  const { data, error } = await admin


    .from("global_learning_patterns_report")
    .select("*")
    .order("total_count", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load global learning report");
  }

  const report = data || [];

  const totalPatterns = report.length;
  const totalEvents = report.reduce(
    (sum, item) => sum + Number(item.total_count || 0),
    0
  );
  const totalSuccesses = report.reduce(
    (sum, item) => sum + Number(item.success_count || 0),
    0
  );
  const totalFailures = report.reduce(
    (sum, item) => sum + Number(item.failure_count || 0),
    0
  );
  const averageSuccessRate =
    totalPatterns > 0
      ? Math.round(
          report.reduce(
            (sum, item) => sum + Number(item.success_rate || 0),
            0
          ) / totalPatterns
        )
      : 0;

  return {
    totalPatterns,
    totalEvents,
    totalSuccesses,
    totalFailures,
    averageSuccessRate,
    report,
  };
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function getRateTone(rate) {
  const normalizedRate = Number(rate || 0);

  if (normalizedRate >= 80) {
    return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
  }

  if (normalizedRate >= 40) {
    return "text-amber-300 bg-amber-500/10 border-amber-500/20";
  }

  return "text-rose-300 bg-rose-500/10 border-rose-500/20";
}

export default async function GlobalLearningReportPage() {
  const data = await getGlobalLearningReport();
  const report = data.report || [];
  const topPatterns = report.slice(0, 3);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 lg:px-10">
        <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-[0_0_60px_rgba(255,255,255,0.04)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-500">
                Virtus AI
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                Global Learning Report
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Executive view of learned behavior patterns, usage outcomes, and
                signal quality across the system.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Portfolio Signal
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {data.averageSuccessRate}%
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Average success rate across active patterns
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_0_30px_rgba(255,255,255,0.03)]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Total Patterns
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {data.totalPatterns}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Distinct learned pattern groups
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_0_30px_rgba(255,255,255,0.03)]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Total Events
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {data.totalEvents}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Total tracked pattern occurrences
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_0_30px_rgba(255,255,255,0.03)]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Success Events
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-300">
              {data.totalSuccesses}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Positive validated outcomes
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_0_30px_rgba(255,255,255,0.03)]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Failure Events
            </p>
            <p className="mt-3 text-3xl font-semibold text-rose-300">
              {data.totalFailures}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Negative or unsuccessful outcomes
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-3">
          {topPatterns.map((item, index) => (
            <div
              key={item.pattern_key}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 to-black p-6 shadow-[0_0_35px_rgba(255,255,255,0.03)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Top Pattern 0{index + 1}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-white">
                    {item.pattern_label}
                  </h2>
                </div>

                <div
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getRateTone(
                    item.success_rate
                  )}`}
                >
                  {item.success_rate}%
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Total
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {item.total_count}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Success
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-300">
                    {item.success_count}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Failure
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-rose-300">
                    {item.failure_count}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Updated
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {formatDate(item.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 shadow-[0_0_40px_rgba(255,255,255,0.03)]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-xl font-semibold text-white">
              Pattern Performance Table
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Full ranked breakdown of learning signals across the system
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/[0.03]">
                <tr className="text-left">
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Pattern
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Key
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Total
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Success
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Failure
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Rate
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Last Event
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Updated
                  </th>
                </tr>
              </thead>

              <tbody>
                {report.map((item, index) => (
                  <tr
                    key={item.pattern_key}
                    className="border-t border-white/5 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-5 align-top">
                      <div>
                        <p className="font-medium text-white">
                          {index + 1}. {item.pattern_label}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5 align-top text-sm text-zinc-400">
                      {item.pattern_key}
                    </td>

                    <td className="px-6 py-5 align-top text-sm font-medium text-white">
                      {item.total_count}
                    </td>

                    <td className="px-6 py-5 align-top text-sm font-medium text-emerald-300">
                      {item.success_count}
                    </td>

                    <td className="px-6 py-5 align-top text-sm font-medium text-rose-300">
                      {item.failure_count}
                    </td>

                    <td className="px-6 py-5 align-top">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getRateTone(
                          item.success_rate
                        )}`}
                      >
                        {item.success_rate}%
                      </span>
                    </td>

                    <td className="px-6 py-5 align-top text-sm text-zinc-400">
                      {formatDate(item.last_event_at)}
                    </td>

                    <td className="px-6 py-5 align-top text-sm text-zinc-400">
                      {formatDate(item.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}