import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import {
  getPlanLabel,
  getDailyMessageLimit,
} from "@/data/virtus-plan-policy";

function SettingsRow({ label, value, href = null, danger = false }) {
  const content = (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-4 shadow-sm backdrop-blur-sm transition ${
        danger
          ? "border-red-900/40 bg-red-950/20 text-red-200 hover:bg-red-950/30"
          : "border-sky-900/25 bg-zinc-950/35 text-white shadow-sky-950/10 hover:border-sky-800/40 hover:bg-zinc-950/55"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-sky-100">{label}</p>
        {value ? (
          <p className="mt-1 text-xs text-zinc-400">{value}</p>
        ) : null}
      </div>

      <span className="ml-4 text-sky-300/60">›</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("plan, plan_status, trial_started_at, trial_ends_at")
      .eq("id", user.id)
      .maybeSingle();

    profile = data || null;
  }

  const currentPlan = profile?.plan || "free";
  const currentPlanStatus = profile?.plan_status || "active";
  const displayPlan = getPlanLabel(currentPlan);
  const dailyMessageLimit = getDailyMessageLimit(currentPlan);

  return (
 <main className="min-h-screen bg-black text-white">
  <div className="mx-auto w-full max-w-6xl px-8 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300/50">
  Virtus AI
</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Account Settings
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage your account, plan, and product settings.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-sky-900/20 bg-zinc-950/35 p-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-2xl border border-sky-900/25 bg-black/30 px-4 py-4 shadow-sm shadow-sky-950/10">
<div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-900/40 bg-sky-950/30 text-sm font-semibold text-sky-200 shadow-sm shadow-sky-950/20">
  {user?.email?.[0]?.toUpperCase() || "V"}
</div>

              <div className="min-w-0">
 <p className="truncate text-sm font-medium text-sky-100">
                  {user?.email?.split("@")[0] || "Virtus User"}
                </p>
                <p className="truncate text-xs text-zinc-400">{displayPlan}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/35 px-4 py-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
                <p className="text-sm font-medium text-white">Profile</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {user?.email || "No active email"}
                </p>
              </div>

              <Link
                href="/upgrade"
               className="flex items-center justify-between rounded-2xl border border-sky-900/25 bg-zinc-950/35 px-4 py-4 text-white shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-zinc-950/55"
              >
                <div>
                  <p className="text-sm font-medium">Upgrade plan</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Manage your Virtus access
                  </p>
                </div>
<span className="text-sky-300/60">›</span>
              </Link>

<div className="flex items-center justify-between rounded-2xl border border-sky-900/25 bg-zinc-950/35 px-4 py-4 text-white shadow-sm shadow-sky-950/10 backdrop-blur-sm">
                <div>
                  <p className="text-sm font-medium">Settings</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Account foundation page
                  </p>
                </div>
  <span className="text-sky-300/70">✓</span>
              </div>

<Link
  href="/"
  className="group flex items-center justify-between rounded-2xl border border-sky-900/25 bg-zinc-950/35 px-4 py-4 text-white shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-sky-950/20"
>
  <div>
    <p className="text-sm font-medium text-sky-100">Back to chat</p>
    <p className="mt-1 text-xs text-sky-300/60">
      Return to Virtus
    </p>
  </div>

  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-900/30 bg-sky-950/20 text-sky-300/70 transition group-hover:bg-sky-900/35 group-hover:text-sky-200">
    ›
  </span>
</Link>
            </div>
          </aside>

<section className="rounded-3xl border border-sky-900/20 bg-zinc-950/35 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
<h2 className="text-xl font-semibold text-sky-100">Settings</h2>
            <p className="mt-2 text-sm text-zinc-400">
              A cleaner account structure, closer to the style you showed.
            </p>

            <div className="mt-6 space-y-3">
              <SettingsRow
                label="Email"
                value={user?.email || "Not signed in"}
              />

              <SettingsRow
                label="Current plan"
                value={displayPlan}
                href="/upgrade"
              />

              <SettingsRow
                label="Plan status"
                value={currentPlanStatus}
              />

              <SettingsRow
                label="Daily message limit"
                value={`${dailyMessageLimit ?? "Unlimited"}`}
              />

              <SettingsRow
                label="User ID"
                value={user?.id || "No active user"}
              />

                                          <SettingsRow
                label="Personalization"
                value="Preferences, memory, and response style"
                href="/account/personalization"
              />

              <SettingsRow
                label="Help"
                value="Support and guidance area"
              />

              <SettingsRow
                label="Log out"
                value="Use the sidebar logout button for now"
                danger
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}