import Link from "next/link";
import BillingPortalButton from "./BillingPortalButton";
import LogoutButton from "./LogoutButton";
import CustomizeAppearance from "./CustomizeAppearance";
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
          : "virtus-theme-card border-sky-900/25 shadow-sky-950/10 hover:border-sky-800/40"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium virtus-theme-title">{label}</p>
        {value ? (
          <p className="mt-1 text-xs virtus-theme-muted">{value}</p>
        ) : null}
      </div>

      <span className="ml-4 text-sky-300/60">&rsaquo;</span>
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
 <main className="min-h-screen virtus-theme-page">
  <div className="mx-auto w-full max-w-6xl px-8 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300/50">
  Virtus AI
</p>
          <h1 className="mt-3 text-3xl font-semibold virtus-theme-title">
            Account Settings
          </h1>
          <p className="mt-2 text-sm virtus-theme-muted">
            Manage your account, plan, and product settings.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="virtus-theme-surface rounded-3xl border border-sky-900/20 p-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 virtus-theme-card rounded-2xl border border-sky-900/25 px-4 py-4 shadow-sm shadow-sky-950/10">
<div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-900/40 bg-sky-950/30 text-sm font-semibold text-sky-200 shadow-sm shadow-sky-950/20">
  {user?.email?.[0]?.toUpperCase() || "V"}
</div>

              <div className="min-w-0">
 <p className="truncate text-sm font-medium virtus-theme-title">
                  {user?.email?.split("@")[0] || "Virtus User"}
                </p>
                <p className="truncate text-xs virtus-theme-muted">{displayPlan}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="virtus-theme-card rounded-2xl border border-sky-900/25 px-4 py-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
                <p className="text-sm font-medium virtus-theme-title">Profile</p>
                <p className="mt-1 text-xs virtus-theme-muted">
                  {user?.email || "No active email"}
                </p>
              </div>

              <Link
                href="/upgrade"
               className="flex items-center justify-between virtus-theme-card rounded-2xl border border-sky-900/25 px-4 py-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-sky-950/10"
              >
                <div>
                  <p className="text-sm font-medium virtus-theme-title">Upgrade plan</p>
                  <p className="mt-1 text-xs virtus-theme-muted">
                    Manage your Virtus access
                  </p>
                </div>
<span className="text-sky-300/60">&rsaquo;</span>
              </Link>

<div className="flex items-center justify-between virtus-theme-card rounded-2xl border border-sky-900/25 px-4 py-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
                <div>
                  <p className="text-sm font-medium virtus-theme-title">Settings</p>
                  <p className="mt-1 text-xs virtus-theme-muted">
                    Account foundation page
                  </p>
                </div>
  <span className="text-sky-300/70">&#10003;</span>
              </div>

<Link
  href="/"
  className="group flex items-center justify-between virtus-theme-card rounded-2xl border border-sky-900/25 px-4 py-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-sky-950/20"
>
  <div>
    <p className="text-sm font-medium virtus-theme-title">Back to chat</p>
    <p className="mt-1 text-xs text-sky-300/60">
      Return to Virtus
    </p>
  </div>

  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-900/30 bg-sky-950/20 text-sky-300/70 transition group-hover:bg-sky-900/35 group-hover:text-sky-200">
    &rsaquo;
  </span>
</Link>
            </div>
          </aside>

<section className="virtus-theme-surface rounded-3xl border border-sky-900/20 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
<h2 className="text-xl font-semibold virtus-theme-title">Settings</h2>
            <p className="mt-2 text-sm virtus-theme-muted">
              A cleaner account structure, closer to the style you showed.
            </p>

            <div className="mt-6">
              <CustomizeAppearance />
            </div>

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

              <BillingPortalButton />

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

                        <LogoutButton />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
