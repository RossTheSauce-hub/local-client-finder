# The Local Client Finder

Free lead-magnet tool for The Paid Creative. Enter a UK postcode/town and a business
type → get ~10 local businesses with **no video on their website** — warm prospects
for a freelance videographer. Email-gated; contacts land in GoHighLevel.

## How it works

1. `/api/search` (streamed NDJSON): Google Places text search (~20–30 businesses),
   then fetches each homepage concurrently (5s per site, 20s overall) and scans the
   HTML for video signals (`<video>`, YouTube/Vimeo/Wistia/Loom embeds, showreel links).
   Results are scored (no video + good rating = warmest), cached in memory for 24h
   per (location, category), and held server-side behind a `searchId`.
2. The client shows real progress, then an email gate with a teaser count.
3. `/api/unlock`: upserts the contact into GoHighLevel (tagged, e.g.
   `lead-magnet-client-finder`) and returns the full results + course URL.
4. Results page: prospect cards with suggested openers, a "no website at all" bonus
   list (max 3), CSV download, and the $27 course CTA.

Rate limit: 3 fresh (non-cached) searches per IP per day (in-memory).

## Setup

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev
```

Env vars: `GOOGLE_PLACES_API_KEY`, `GHL_PRIVATE_TOKEN`, `GHL_LOCATION_ID`,
`GHL_TAG`, `COURSE_URL`. See `.env.example`.

- Google: enable **Places API (New)** for the key. Each search costs one Text Search
  call (two when the radius widens); the 24h cache keeps repeat searches free.
- GHL: create a **Private Integration** token with contact write scope; a workflow
  in GHL should trigger off the tag to deliver the nurture sequence.

## Deploy (Vercel)

Push to a repo, import into Vercel, set the env vars, deploy. The search route sets
`maxDuration = 60`. Caches/rate limits are per warm lambda — fine for V1; swap
`lib/store.ts` for Vercel KV if volume grows.
