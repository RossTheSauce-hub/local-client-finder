/** Google Places API (New) text search, server-side only. */

import type { Country } from "./countries";

export interface PlaceResult {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  reviews: number | null;
}

interface RawPlace {
  id?: string;
  displayName?: { text?: string };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
].join(",");

async function textSearch(
  textQuery: string,
  regionCode: string,
  apiKey: string,
): Promise<PlaceResult[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery, maxResultCount: 20, regionCode }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Places API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { places?: RawPlace[] };
  return (data.places ?? [])
    .filter((p): p is RawPlace & { id: string } => Boolean(p.id))
    .map((p) => ({
      id: p.id,
      name: p.displayName?.text ?? "Unknown business",
      website: p.websiteUri ?? null,
      phone: p.nationalPhoneNumber ?? null,
      address: p.formattedAddress ?? null,
      rating: p.rating ?? null,
      reviews: p.userRatingCount ?? null,
    }));
}

const MOCK_PLACES: PlaceResult[] = [
  { id: "m1", name: "Inkhouse Tattoo Collective", website: "https://www.bbc.co.uk", phone: "0114 234 5678", address: "12 Division St, Sheffield S1 4GF", rating: 4.9, reviews: 187 },
  { id: "m2", name: "Steel City Tattoo", website: "https://example.com", phone: "0114 111 2222", address: "45 Abbeydale Rd, Sheffield S7 1FS", rating: 4.8, reviews: 92 },
  { id: "m3", name: "Black Lantern Studio", website: "https://www.wikipedia.org", phone: "0114 333 4444", address: "8 Ecclesall Rd, Sheffield S11 8PN", rating: 4.7, reviews: 64 },
  { id: "m4", name: "Crooked Needle", website: "https://www.gov.uk", phone: null, address: "22 London Rd, Sheffield S2 4LN", rating: 4.6, reviews: 41 },
  { id: "m5", name: "Seven Hills Ink", website: "https://developer.mozilla.org", phone: "0114 555 6666", address: "3 West St, Sheffield S1 4EQ", rating: 5.0, reviews: 28 },
  { id: "m6", name: "The Velvet Anchor", website: "https://this-domain-does-not-exist-xyz123.co.uk", phone: "0114 777 8888", address: "19 Sharrow Vale Rd, Sheffield S11 8ZF", rating: 4.5, reviews: 113 },
  { id: "m7", name: "Northern Soul Tattoo", website: null, phone: "0114 999 0000", address: "7 Chesterfield Rd, Sheffield S8 0RL", rating: 4.9, reviews: 76 },
  { id: "m8", name: "Marrow & Pin", website: null, phone: "0114 121 2121", address: "31 Infirmary Rd, Sheffield S6 3DH", rating: 4.4, reviews: 22 },
  { id: "m9", name: "Golden Hour Tattoo Parlour", website: "https://www.rust-lang.org", phone: "0114 343 4343", address: "56 Glossop Rd, Sheffield S10 2GE", rating: 4.8, reviews: 154 },
  { id: "m10", name: "Fable & Flash", website: "https://nodejs.org", phone: "0114 565 6565", address: "2 Kelham Island, Sheffield S3 8SA", rating: 4.7, reviews: 89 },
];

/** Sites that are directories/aggregators, not the business's own website. */
const AGGREGATOR_HOSTS =
  /(facebook|instagram|linktr\.ee|justeat|just-eat|deliveroo|ubereats|tripadvisor|yell\.com|booksy|treatwell|fresha|squareup|wix\.com\/website|google\.com)/i;

export function isRealWebsite(url: string | null): boolean {
  if (!url) return false;
  return !AGGREGATOR_HOSTS.test(url);
}

/**
 * Search for businesses near a location in the given country. If the first pass
 * returns too few results, widens once with a broader query. Deduped by place id.
 */
export async function searchBusinesses(
  categoryQuery: string,
  location: string,
  country: Country,
): Promise<{ places: PlaceResult[]; widened: boolean }> {
  // Dev-only mock so the full pipeline (incl. real video checks) can be
  // exercised without a Places key. Never active in production builds.
  if (process.env.MOCK_PLACES === "1" && process.env.NODE_ENV !== "production") {
    return { places: MOCK_PLACES, widened: false };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const first = await textSearch(
    `${categoryQuery} in ${location}, ${country.name}`,
    country.regionCode,
    apiKey,
  );
  if (first.length >= 12) return { places: first, widened: false };

  // Widen once: "near" nudges Places to expand the search area.
  const second = await textSearch(
    `${categoryQuery} near ${location}, ${country.name}`,
    country.regionCode,
    apiKey,
  ).catch(() => [] as PlaceResult[]);

  const seen = new Set(first.map((p) => p.id));
  const merged = [...first, ...second.filter((p) => !seen.has(p.id))];
  return { places: merged, widened: true };
}
