import Link from "next/link";
import { membershipCapabilities } from "@/lib/virtus-membership.mjs";

export const metadata = {
  title: "Life Coach, Trainer and Mentor | Virtus AI",
  description: "Compare Virtus AI coaching memberships, personal development pathways and practice levels.",
};

const plans = [
  { key: "life_coach", price: "$9.99", heading: "Understand yourself",
    description: "Build awareness of your thoughts, interpretations, emotions and responses.",
    features: [
      "Guided coaching and saved personal reflections",
      "Personal development goals and client-authored progress",
      "Foundational self-awareness and emotion regulation practices",
      "Up to 3 project spaces and 40 messages per day",
    ],
  },
  { key: "plus", price: "$19.99", heading: "Develop your capabilities",
    description: "Train communication, disciplined responses and practical skills through guided rehearsal.",
    features: [
      "Everything in Life Coach",
      "Structured skills practice and guided role-play",
      "Cross-conversation personal continuity",
      "Up to 5 project spaces and 120 messages per day",
    ],
  },
  { key: "premium", price: "$29.99", heading: "Master your direction",
    description: "Integrate your learning into leadership, complex decisions and sustained development.",
    features: [
      "Everything in Trainer",
      "Advanced decision and leadership simulations",
      "Extended personal and project continuity",
      "Higher-capacity conversations under fair-use and provider limits",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="virtus-subpage-modern min-h-screen bg-[#091b1c] px-5 py-14 text-[#f5f3ec]">
      <section className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d8bd85]">Virtus AI · Enhanced Wellness Solutions</p>
          <h1 className="mt-5 font-serif text-3xl tracking-tight md:text-5xl">Understand. Practice. Master.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#b9cbc5]">
            Every membership offers truthful and psychologically responsible guidance.
            Higher tiers add structured training, stronger continuity and advanced mentoring workflows.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan, index) => {
            const capabilities = membershipCapabilities(plan.key);
            return (
              <article key={plan.key} className={`flex flex-col rounded-3xl border p-6 shadow-2xl ${index === 2 ? "border-[#d8bd85]/75 bg-[#173632]" : "border-[#42615a] bg-[#112b2a]"}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8bd85]">Virtus {capabilities.publicName}</p>
                <h2 className="mt-4 font-serif text-2xl text-[#fff0c1]">{plan.heading}</h2>
                <p className="mt-4 text-4xl font-semibold">{plan.price}<span className="ml-1 text-sm font-normal text-[#b9cbc5]">/ month</span></p>
                <p className="mt-4 min-h-20 text-sm leading-6 text-[#c5d3cd]">{plan.description}</p>
                <div className="mt-4 rounded-xl border border-[#d8bd85]/35 bg-[#0a2925] px-4 py-3 text-sm text-[#f8dc9b]">
                  <strong>{capabilities.maxActiveGoals} active goals</strong>
                  <span className="mt-1 block text-xs text-[#c8d5cc]">{capabilities.programDays.join(" / ")}-day development pathways</span>
                </div>
                <ul className="mt-5 flex-1 space-y-3 border-t border-white/10 pt-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm text-[#e1e8e2]">
                      <span aria-hidden="true" className="text-[#d8bd85]">✓</span>{feature}
                    </li>
                  ))}
                </ul>
                <Link href="/upgrade" className={`mt-7 rounded-xl px-4 py-3 text-center text-sm font-semibold ${index === 2 ? "bg-[#e3c481] text-[#09291f]" : "border border-[#d8bd85]/65 text-[#f7dfab] hover:bg-[#1a4b3c]"}`}>
                  Compare billing and choose a membership
                </Link>
              </article>
            );
          })}
        </div>
        <section className="mt-9 rounded-3xl border border-[#d8bd85]/55 bg-[#152e2a] p-7 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8bd85]">Virtus for Organizations</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <h2 className="font-serif text-2xl text-[#f2ddb0]">Private coaching for your people. Responsible development for your organization.</h2>
              <p className="mt-3 text-sm leading-6 text-[#c5d3cc]">Corporate subscriptions, seat invitations and EWS leadership development are being prepared. Organizations manage subscriptions, not private employee conversations.</p>
            </div>
            <Link href="/organizations" className="rounded-xl border border-[#d8bd85] px-5 py-3 text-sm font-semibold text-[#f3dda7]">Explore Organizations</Link>
          </div>
        </section>
        <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-6 text-[#b9cbc5]">
          A development day advances only after a completed self-reflection. Voice add-ons and professional-led
          sessions are not included unless separately offered. Memberships support coaching, learning and
          personal development, not independent clinical diagnosis or psychotherapy.
        </p>
        <div className="mt-9 text-center">
          <Link href="/" className="inline-flex rounded-xl border border-[#d8bd85]/60 px-6 py-3 text-sm font-semibold text-[#f5f3ec]">Return to Virtus AI</Link>
        </div>
      </section>
    </main>
  );
}
