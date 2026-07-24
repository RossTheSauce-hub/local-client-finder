"use client";

export function ScanProgress({
  stages,
  progress,
}: {
  stages: string[];
  progress: { checked: number; total: number } | null;
}) {
  const pct = progress
    ? Math.round((progress.checked / Math.max(progress.total, 1)) * 100)
    : stages.length > 0
      ? 8
      : 3;

  return (
    <section className="flex flex-1 flex-col justify-center py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.25em]">
          <span className="flex items-center gap-2 text-amber">
            <span className="rec-dot" aria-hidden />
            Scanning
          </span>
          <span className="text-faint tabular-nums">
            {progress ? `${progress.checked}/${progress.total} sites` : "…"}
          </span>
        </div>

        <div className="scrub mt-4">
          <div className="scrub-fill" style={{ width: `${Math.max(pct, 3)}%` }} />
        </div>

        <div className="mt-8 space-y-2.5 rounded-xl border border-line bg-surface/70 p-5 font-mono text-[13px] leading-relaxed">
          {stages.map((s, i) => (
            <p key={i} className="log-line flex gap-2.5 text-muted">
              <span className="shrink-0 text-amber-deep">▸</span>
              <span>{s}</span>
            </p>
          ))}
          <p className="log-line flex gap-2.5 text-faint" key={`cursor-${stages.length}`}>
            <span className="shrink-0 text-amber-deep">▸</span>
            <span className="animate-pulse">_</span>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-faint">
          The wait is the point — we&apos;re actually visiting each website.
        </p>
      </div>
    </section>
  );
}
