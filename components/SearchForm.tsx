"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { COUNTRIES, DEFAULT_COUNTRY, getCountry } from "@/lib/countries";

export interface SearchInput {
  location: string;
  category: string;
  otherText: string;
  country: string;
}

export function SearchForm({
  onSubmit,
  error,
}: {
  onSubmit: (input: SearchInput) => void;
  error: string | null;
}) {
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [otherText, setOtherText] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY.code);

  const placeholder =
    (getCountry(country) ?? DEFAULT_COUNTRY).placeholder;

  const canSubmit =
    location.trim().length >= 2 &&
    (category !== "other" || otherText.trim().length >= 2);

  return (
    <section className="flex flex-1 flex-col justify-center py-10">
      <p
        className="reveal font-mono text-[11px] uppercase tracking-[0.3em] text-amber"
        style={{ animationDelay: "0.05s" }}
      >
        Scene 01 — Find your first client
      </p>

      <h1
        className="reveal mt-4 text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl"
        style={{ animationDelay: "0.15s" }}
      >
        10 local businesses
        <br />
        that{" "}
        <span className="relative inline-block text-amber">
          need video.
          <svg
            className="absolute -bottom-1.5 left-0 w-full"
            viewBox="0 0 200 9"
            fill="none"
            aria-hidden
          >
            <path
              d="M2 6.5C60 2.5 140 2.5 198 5.5"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>
        </span>
      </h1>

      <p
        className="reveal mt-5 max-w-md text-[17px] leading-relaxed text-muted"
        style={{ animationDelay: "0.25s" }}
      >
        Enter your postcode. We scan local businesses&apos; websites for video —
        and hand you the ones that have <em className="text-paper not-italic font-semibold">none</em>.
        Your warmest prospects, in about 60 seconds.
      </p>

      <form
        className="reveal mt-9 space-y-3 rounded-2xl border border-line bg-surface/80 p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-6"
        style={{ animationDelay: "0.35s" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit)
            onSubmit({ location: location.trim(), category, otherText: otherText.trim(), country });
        }}
      >
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Country
          </span>
          <select
            className="field"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Your patch
          </span>
          <input
            className="field"
            type="text"
            placeholder={placeholder}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            autoComplete="postal-code"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Who you want to film for
          </span>
          <select
            className="field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {category === "other" && (
          <input
            className="field"
            type="text"
            placeholder="Describe it — e.g. dog groomer, florist…"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            maxLength={60}
            required
          />
        )}

        {error && (
          <p className="rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">
            {error}
          </p>
        )}

        <button className="btn-amber" type="submit" disabled={!canSubmit}>
          Find my 10 prospects
          <span aria-hidden>→</span>
        </button>

        <p className="pt-1 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          Free · No account · 3 searches a day
        </p>
      </form>
    </section>
  );
}
