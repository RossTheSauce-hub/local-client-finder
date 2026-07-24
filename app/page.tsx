"use client";

import { useCallback, useState } from "react";
import type { SearchEvent, SearchResults } from "@/lib/types";
import { SearchForm, type SearchInput } from "@/components/SearchForm";
import { ScanProgress } from "@/components/ScanProgress";
import { EmailGate } from "@/components/EmailGate";
import { Results } from "@/components/Results";

export interface Teaser {
  /** Sealed results token from the search; null on the email-only fallback path. */
  token: string | null;
  noVideoCount: number;
  noWebsiteCount: number;
  totalFound: number;
  location: string;
  fewResults: boolean;
  /** True when the search itself failed — we capture the email and promise the list later. */
  fallback: boolean;
}

type Phase =
  | { name: "form" }
  | { name: "scanning" }
  | { name: "gate"; teaser: Teaser }
  | { name: "results"; results: SearchResults; courseUrl: string }
  | { name: "captured"; courseUrl: string };

export default function Home() {
  const [phase, setPhase] = useState<Phase>({ name: "form" });
  const [formError, setFormError] = useState<string | null>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ checked: number; total: number } | null>(null);
  const [lastSearch, setLastSearch] = useState<SearchInput | null>(null);

  const runSearch = useCallback(async (input: SearchInput) => {
    setFormError(null);
    setStages([]);
    setProgress(null);
    setLastSearch(input);
    setPhase({ name: "scanning" });

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      // Validation / rate-limit errors come back as plain JSON.
      if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setFormError(data.error ?? "Something went wrong — try again.");
        setPhase({ name: "form" });
        return;
      }
      if (!res.ok || !res.body) {
        setFormError("Something went wrong — try again.");
        setPhase({ name: "form" });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleEvent = (event: SearchEvent) => {
        if (event.type === "stage") {
          setStages((s) => [...s, event.message]);
        } else if (event.type === "progress") {
          setProgress({ checked: event.checked, total: event.total });
        } else if (event.type === "done") {
          setPhase({
            name: "gate",
            teaser: {
              token: event.token,
              noVideoCount: event.noVideoCount,
              noWebsiteCount: event.noWebsiteCount,
              totalFound: event.totalFound,
              location: event.location,
              fewResults: event.fewResults,
              fallback: false,
            },
          });
        } else if (event.type === "error") {
          if (event.emailFallback) {
            setPhase({
              name: "gate",
              teaser: {
                token: null,
                noVideoCount: 0,
                noWebsiteCount: 0,
                totalFound: 0,
                location: input.location,
                fewResults: false,
                fallback: true,
              },
            });
          } else {
            setFormError(event.message);
            setPhase({ name: "form" });
          }
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) handleEvent(JSON.parse(line) as SearchEvent);
        }
      }
      if (buffer.trim()) handleEvent(JSON.parse(buffer) as SearchEvent);
    } catch {
      setFormError("Connection dropped mid-search — give it another go.");
      setPhase({ name: "form" });
    }
  }, []);

  const unlock = useCallback(
    async (email: string, firstName: string, teaser: Teaser): Promise<string | null> => {
      try {
        const res = await fetch("/api/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firstName,
            token: teaser.token,
            location: lastSearch?.location,
            category: lastSearch?.category,
          }),
        });
        const data = await res.json();
        if (!res.ok) return data.error ?? "Something went wrong — try again.";

        if (data.results) {
          setPhase({ name: "results", results: data.results, courseUrl: data.courseUrl });
        } else if (teaser.fallback) {
          setPhase({ name: "captured", courseUrl: data.courseUrl });
        } else {
          // Results expired between search and unlock — rare; rerun is instant (cached).
          setFormError(data.error ?? "Your search expired — run it again, it'll be instant.");
          setPhase({ name: "form" });
        }
        return null;
      } catch {
        return "Connection dropped — try again.";
      }
    },
    [lastSearch],
  );

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-16">
      <header className="flex items-center justify-between border-b border-line py-4">
        <div className="flex items-center gap-2.5">
          <span className="rec-dot" aria-hidden />
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
            The Paid Creative
          </span>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          Free tool · No.01
        </span>
      </header>

      {phase.name === "form" && <SearchForm onSubmit={runSearch} error={formError} />}
      {phase.name === "scanning" && <ScanProgress stages={stages} progress={progress} />}
      {phase.name === "gate" && <EmailGate teaser={phase.teaser} onUnlock={unlock} />}
      {phase.name === "results" && (
        <Results results={phase.results} courseUrl={phase.courseUrl} />
      )}
      {phase.name === "captured" && (
        <section className="reveal flex flex-1 flex-col items-center justify-center py-20 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber">
            You&apos;re on the list
          </p>
          <h2 className="mt-4 text-3xl font-bold">Check your inbox.</h2>
          <p className="mt-3 max-w-sm text-muted">
            We&apos;ll run your search manually and email your prospect list as soon as
            it&apos;s ready — usually within a few hours.
          </p>
        </section>
      )}

      <footer className="mt-auto pt-12 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Built by The Paid Creative · Data via Google
      </footer>
    </main>
  );
}
