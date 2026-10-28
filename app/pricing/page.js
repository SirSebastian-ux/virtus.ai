import Link from "next/link";

export const metadata = {
  title: "Coaching Plans | Virtus AI",
  description: "Explore Virtus AI Life Coach, Trainer, and Mentor, powered by Enhanced Wellness Solutions.",
};

const plans = [
  {
    name: "Life Coach",
    price: "$9.99",
    description: "Personal reflection, self-awareness, emotional discipline, and everyday growth.",
    features: ["Guided AI coaching conversations", "Personal goals and reflection", "Saved conversations and continuity"],
  },
  {
    name: "Trainer",
    price: "$19.99",
    description: "Structured learning and practical development using the EWS workbook library.",
    features: ["Everything in Life Coach", "Guided workbook exercises", "Learning pathways and progress reviews"],
  },
  {
    name: "Mentor",
    price: "$29.99",
    description: "Advanced leadership, decision-making, accountability, and long-term development.",
    features: ["Everything in Trainer", "Leadership and strategic reflection", "Long-term mentoring objectives"],
  },
];

export default function PricingPage() {
  return (
    <main className="virtus-subpage-modern min-h-screen bg-[#091b1c] px-5 py-14 text-[#f5f3ec]">
      <section className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d8bd85]">Virtus AI · Enhanced Wellness Solutions</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">Your growth. Your pace. Your guide.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#b9cbc5]">
            Choose your level of personal development. Every higher plan includes the experiences below it.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan, index) => (
            <article key={plan.name} className={`flex flex-col rounded-3xl border p-7 shadow-2xl ${index === 2 ? "border-[#d8bd85]/70 bg-[#173632]" : "border-[#42615a] bg-[#112b2a]"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8bd85]">Virtus {plan.name}</p>
              <h2 className="mt-4 text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-4 text-4xl font-semibold">{plan.price}<span className="ml-1 text-sm font-normal text-[#b9cbc5]">/ month</span></p>
              <p className="mt-5 min-h-20 text-sm leading-6 text-[#c5d3cd]">{plan.description}</p>
              <ul className="mt-6 flex-1 space-y-3 border-t border-white/10 pt-6">
                {plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm text-[#e1e8e2]"><span aria-hidden="true" className="text-[#d8bd85]">✓</span>{feature}</li>)}
              </ul>
              <p className="mt-7 rounded-xl border border-[#d8bd85]/30 px-4 py-3 text-center text-sm text-[#e4d0a5]">Enrollment opening soon</p>
            </article>
          ))}
        </div>
        <p className="mt-7 text-center text-xs text-[#b9cbc5]">Indicative launch pricing. Paid enrollment will open after subscription and access verification.</p>
        <div className="mt-9 text-center"><Link href="/" className="inline-flex rounded-xl border border-[#d8bd85]/60 px-6 py-3 text-sm font-semibold text-[#f5f3ec] hover:bg-white/10">Return to Virtus AI</Link></div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-6 text-[#9fb4ad]">Virtus AI supports education, coaching, and self-development. It is not a replacement for licensed mental health care.</p>
      </section>
    </main>
  );
}
