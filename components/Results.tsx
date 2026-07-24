"use client";

import { useState } from "react";
import type { Prospect, SearchResults } from "@/lib/types";

function csvEscape(value: string | number | null): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(results: SearchResults) {
  const header = [
    "Name", "Website", "Phone", "Address", "Rating", "Reviews", "Video status", "Suggested opener",
  ];
  const rows = [...results.prospects, ...results.noWebsite].map((p) => [
    p.name,
    p.website ?? "no website",
    p.phone,
    p.address,
    p.rating,
    p.reviews,
    p.website
      ? p.videoStatus === "none"
        ? "No video found"
        : "Couldn't check"
      : "No website",
    p.opener,
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map(csvEscape).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `client-finder-${results.location.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function CopyOpener({ opener }: { opener: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="shrink-0 rounded-md border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted transition-colors hover:border-amber hover:text-amber"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(opener);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

function ProspectCard({ p, rank, delay }: { p: Prospect; rank: number; delay: number }) {
  return (
    <article
      className="reveal rounded-xl border border-line bg-surface/80 p-5"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-amber-deep">
            {String(rank).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-[17px] font-bold leading-snug">{p.name}</h3>
            {p.address && (
              <p className="mt-0.5 text-[13px] text-muted">{p.address}</p>
            )}
          </div>
        </div>
        {p.rating != null && (
          <span className="shrink-0 font-mono text-[12px] text-muted">
            ★ {p.rating.toFixed(1)}
            {p.reviews ? <span className="text-faint"> ({p.reviews})</span> : null}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {p.website ? (
          p.videoStatus === "none" ? (
            <span className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-mint">
              No video on site
            </span>
          ) : (
            <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              Couldn&apos;t check site
            </span>
          )
        ) : (
          <span className="rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-amber">
            No website at all
          </span>
        )}
        {p.website && (
          <a
            className="font-mono text-[12px] text-amber underline decoration-amber/40 underline-offset-4 hover:decoration-amber"
            href={p.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit site ↗
          </a>
        )}
        {p.phone && (
          <a className="font-mono text-[12px] text-muted hover:text-paper" href={`tel:${p.phone}`}>
            {p.phone}
          </a>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-lg border-l-2 border-amber/60 bg-surface-2/70 py-3 pl-4 pr-3">
        <p className="flex-1 text-[13.5px] leading-relaxed text-muted">
          &ldquo;{p.opener}&rdquo;
        </p>
        <CopyOpener opener={p.opener} />
      </div>
    </article>
  );
}

export function Results({
  results,
  courseUrl,
}: {
  results: SearchResults;
  courseUrl: string;
}) {
  return (
    <section className="py-10">
      <p className="reveal font-mono text-[11px] uppercase tracking-[0.3em] text-amber">
        Your shot list
      </p>
      <h2 className="reveal mt-3 text-3xl font-extrabold leading-tight sm:text-4xl" style={{ animationDelay: "0.08s" }}>
        {results.prospects.length} warm prospects near {results.location}.
      </h2>
      <p className="reveal mt-3 max-w-lg text-muted" style={{ animationDelay: "0.16s" }}>
        We scanned {results.checkedCount} {results.categoryLabel.toLowerCase()} websites.
        These have <span className="font-semibold text-paper">no video anywhere on their homepage</span> —
        which means the first filmmaker to reach out looks like a mind-reader.
      </p>

      <div className="reveal mt-5" style={{ animationDelay: "0.22s" }}>
        <button
          type="button"
          className="rounded-lg border border-line bg-surface px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.15em] text-muted transition-colors hover:border-amber hover:text-amber"
          onClick={() => downloadCsv(results)}
        >
          ↓ Download list as CSV
        </button>
      </div>

      <div className="mt-7 space-y-4">
        {results.prospects.map((p, i) => (
          <ProspectCard key={p.id} p={p} rank={i + 1} delay={0.25 + i * 0.06} />
        ))}
      </div>

      {results.noWebsite.length > 0 && (
        <div className="mt-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">
            Bonus — even warmer
          </p>
          <h3 className="mt-2 text-xl font-bold">
            No website found at all.
          </h3>
          <p className="mt-1.5 max-w-lg text-sm text-muted">
            These businesses are running on word of mouth alone. A short film{" "}
            <em>plus</em> somewhere to put it is a bigger, easier sell.
          </p>
          <div className="mt-5 space-y-4">
            {results.noWebsite.map((p, i) => (
              <ProspectCard key={p.id} p={p} rank={results.prospects.length + i + 1} delay={0.1 + i * 0.06} />
            ))}
          </div>
        </div>
      )}

      <aside className="reveal relative mt-14 overflow-hidden rounded-2xl border border-amber/40 bg-gradient-to-b from-surface-2 to-surface p-7 sm:p-9" style={{ animationDelay: "0.2s" }}>
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-amber/15 blur-3xl"
          aria-hidden
        />
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">
          Next scene
        </p>
        <h3 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
          You&apos;ve got your list.
          <br />
          Now learn exactly what to sell them.
        </h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          The 30-Day First Client System teaches you what to offer, how to pitch it,
          and how to book the shoot — the exact playbook this tool was built from.
        </p>
        <a
          className="btn-amber mt-6 !w-auto inline-flex px-7"
          href={courseUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get the system — $27
        </a>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
          One-time · Instant access
        </p>
      </aside>
    </section>
  );
}
