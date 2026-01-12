export default function DebugStylesPage() {
  return (
    <main className="min-h-screen bg-[color:var(--seasalt)] px-6 py-16 text-[color:var(--night)]">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[color:var(--gold)]">
            Debug Styles
          </p>
          <h1 className="text-3xl font-black">Aleo font + Tailwind + CSS variables</h1>
          <p className="text-sm text-[color:var(--muted)]">
            If this page is styled, Tailwind and globals are loading correctly in prod.
          </p>
        </header>

        <section className="rounded-[var(--radius-xl)] border border-[color:var(--border)] bg-white p-8 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-black">Primary checks</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn-gold">Tailwind button</button>
            <button className="btn-dark">Dark button</button>
            <button className="btn-ghost bg-black/80">Ghost button</button>
          </div>
        </section>

        <section className="card-premium space-y-3">
          <h3 className="text-lg font-black">CSS variables</h3>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-full bg-[color:var(--gold)] px-3 py-1 text-[#14140f]">--gold</span>
            <span className="rounded-full bg-[color:var(--silver)] px-3 py-1 text-[#14140f]">--silver</span>
            <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[color:var(--night)]">
              --border
            </span>
          </div>
          <p className="text-sm text-[color:var(--muted)]">
            The card uses `card-premium` and `--shadow-soft`.
          </p>
        </section>
      </div>
    </main>
  );
}
