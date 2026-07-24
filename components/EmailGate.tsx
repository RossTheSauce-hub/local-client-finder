"use client";

import { useState } from "react";
import type { Teaser } from "@/app/page";

const FAKE_ROWS = [
  "Blackline Studio · ★ 4.9 · no video on site",
  "The Yard Collective · ★ 4.8 · no video on site",
  "Northgate & Co · ★ 4.7 · no video on site",
];

export function EmailGate({
  teaser,
  onUnlock,
}: {
  teaser: Teaser;
  onUnlock: (email: string, teaser: Teaser) => Promise<string | null>;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = teaser.noVideoCount + teaser.noWebsiteCount;

  return (
    <section className="flex flex-1 flex-col justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <p className="reveal text-center font-mono text-[11px] uppercase tracking-[0.3em] text-amber">
          {teaser.fallback ? "Almost there" : "Search complete"}
        </p>

        <h2
          className="reveal mt-4 text-center text-3xl font-extrabold leading-tight sm:text-4xl"
          style={{ animationDelay: "0.1s" }}
        >
          {teaser.fallback ? (
            <>We&apos;ll send your list to your inbox.</>
          ) : (
            <>
              We found <span className="text-amber">{total}</span> businesses near{" "}
              {teaser.location} with no video on their site.
            </>
          )}
        </h2>

        {teaser.fallback ? (
          <p
            className="reveal mt-4 text-center text-muted"
            style={{ animationDelay: "0.2s" }}
          >
            Live business data is having a moment. Drop your email and we&apos;ll run
            the search for you and email your prospect list.
          </p>
        ) : (
          <>
            {teaser.fewResults && (
              <p
                className="reveal mt-3 text-center text-sm text-muted"
                style={{ animationDelay: "0.15s" }}
              >
                Quiet area — we widened the net. For a longer list, try a nearby
                bigger town next time.
              </p>
            )}
            <div
              className="reveal relative mt-7 overflow-hidden rounded-xl border border-line bg-surface/70"
              style={{ animationDelay: "0.2s" }}
              aria-hidden
            >
              <div className="teaser-blur space-y-3 p-5 font-mono text-[13px] text-muted">
                {FAKE_ROWS.map((row) => (
                  <p key={row}>{row}</p>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-ink/40 to-ink/90">
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-paper">
                  🔒 Unlock to reveal
                </span>
              </div>
            </div>
          </>
        )}

        <form
          className="reveal mt-6 space-y-3"
          style={{ animationDelay: "0.3s" }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError(null);
            const err = await onUnlock(email.trim(), teaser);
            if (err) {
              setError(err);
              setBusy(false);
            }
          }}
        >
          <input
            className="field"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {error && (
            <p className="rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">
              {error}
            </p>
          )}
          <button className="btn-amber" type="submit" disabled={busy || !email.includes("@")}>
            {busy
              ? "Unlocking…"
              : teaser.fallback
                ? "Email me my list"
                : "Unlock my list — free"}
          </button>
          <p className="text-center text-[12px] leading-relaxed text-faint">
            We&apos;ll email you the occasional no-fluff tip on landing paying video
            clients. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </section>
  );
}
