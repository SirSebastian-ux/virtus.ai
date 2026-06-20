export default function OperationsPaymentsPage() {
  const paymentFields = [
    "Client name",
    "Service paid for",
    "Amount",
    "Payment method",
    "Payment proof",
    "Reference or receipt number",
    "Confirmation status",
    "Notes",
  ];

  const methods = ["Bank deposit", "Cash", "e-Mola", "M-Pesa", "Card", "Other"];

  return (
    <section className="px-6 py-8">        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
              Payment Intelligence
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-white">
              Payments
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Employees can record payments manually or through Operations Chat.
              The system will structure the payment data and flag missing proof,
              missing references, or unconfirmed payments.
            </p>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <h2 className="text-lg font-semibold text-sky-100">Payment Methods</h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {methods.map((method) => (
                  <div key={method} className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300">
                    {method}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold text-sky-100">Payment Record Structure</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {paymentFields.map((field) => (
                <div key={field} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <p className="text-sm text-zinc-300">{field}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-900/30 bg-amber-950/10 p-4">
              <h3 className="text-sm font-semibold text-amber-200">Management Alerts</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                The system should alert management when a payment is missing proof,
                missing a reference number, or remains unconfirmed.
              </p>
            </div>
          </section>
        </div>
    </section>
  );
}

