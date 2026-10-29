import Link from "next/link";

const CONCEPTS = [
  {
    id: "a",
    name: "A — Editorial Monogram",
    description:
      "Refined BB monogram in a square frame. Institutional fintech — strong at small sizes.",
    tag: "Stripe / Ramp feel",
  },
  {
    id: "b",
    name: "B — Geometric Flow",
    description:
      "Square outline with a single gold line. Minimal, modern SaaS — no letters in the mark.",
    tag: "Linear / Notion feel",
  },
  {
    id: "c",
    name: "C — Typographic Luxury",
    description:
      "Wordmark-first with wide tracking and gold rule. Most premium; icon is a corner bracket.",
    tag: "Private club / wealth feel",
  },
] as const;

function PreviewCard({
  concept,
}: {
  concept: (typeof CONCEPTS)[number];
}) {
  const base = `/logo-concepts/${concept.id}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-border-dim bg-white shadow-sm">
      <div className="border-b border-border-dim bg-canvas px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-ink">{concept.name}</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-3">{concept.description}</p>
          </div>
          <span className="rounded-full bg-brass-100 px-3 py-1 text-[13px] font-medium text-brass-700">
            {concept.tag}
          </span>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        {/* Sidebar mock */}
        <div className="border-b border-border-dim p-6 lg:border-b-0 lg:border-r">
          <p className="mb-3 text-[13px] font-medium uppercase tracking-widest text-ink-5">Sidebar header</p>
          <div className="rounded-xl border border-border-dim bg-white p-5 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${base}/icon.svg`} alt={concept.name} className="h-9 w-auto max-w-[220px] object-contain object-left" />
            <div className="mt-5 space-y-2">
              <div className="h-9 rounded-lg bg-brass-100" />
              <div className="h-9 rounded-lg bg-canvas" />
              <div className="h-9 rounded-lg bg-canvas" />
            </div>
          </div>
        </div>

        {/* Auth mock */}
        <div className="p-6">
          <p className="mb-3 text-[13px] font-medium uppercase tracking-widest text-ink-5">Login card</p>
          <div className="mx-auto max-w-sm rounded-2xl border border-border-dim bg-white p-8 shadow-sm">
            <div className="mb-6 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${base}/icon.svg`} alt={concept.name} className="h-10 w-auto max-w-[240px] object-contain" />
            </div>
            <div className="space-y-3">
              <div className="h-11 rounded-xl bg-brass-100" />
              <div className="h-11 rounded-xl bg-brass-100" />
              <div className="h-12 rounded-xl bg-brass-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-t border-border-dim bg-canvas/60 p-6 sm:grid-cols-3">
        <div>
          <p className="mb-2 text-[13px] font-medium uppercase tracking-widest text-ink-5">Wordmark</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${base}/icon.svg`} alt="" className="h-12 w-auto object-contain" />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium uppercase tracking-widest text-ink-5">App icon</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${base}/icon.svg`} alt="" className="h-16 w-16 rounded-xl object-contain shadow-sm" />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium uppercase tracking-widest text-ink-5">Favicon</p>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${base}/icon.svg`} alt="" className="h-8 w-8 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${base}/icon.svg`} alt="" className="h-4 w-4 object-contain opacity-80" />
            <span className="text-xs text-ink-4">48px / 16px</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BrandPreviewPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-border-dim bg-white px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-[13px] font-medium uppercase tracking-widest text-brass-700">Brand preview</p>
          <h1 className="mt-2 text-3xl font-medium text-ink">Pick a logo direction</h1>
          <p className="mt-2 max-w-2xl text-ink-3">
            All three concepts below use the same vault gold (<code className="text-ink-2">#D4AF37</code>) and forest/sage palette on this dark UI. Reply with <strong>A</strong>, <strong>B</strong>, or <strong>C</strong> to finalize.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-brass-700 hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        {CONCEPTS.map((concept) => (
          <PreviewCard key={concept.id} concept={concept} />
        ))}
      </main>
    </div>
  );
}
