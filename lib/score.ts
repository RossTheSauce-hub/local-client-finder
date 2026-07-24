import type { Prospect, SearchResults, VideoStatus } from "./types";
import type { PlaceResult } from "./places";
import { isRealWebsite } from "./places";
import { getCategory, GENERIC_OPENER } from "./categories";

function scoreProspect(p: PlaceResult, videoStatus: VideoStatus): number {
  let score = 0;
  if (videoStatus === "none") score += 50; // confirmed no video = warmest
  if (videoStatus === "unchecked") score += 10; // deprioritised, not excluded
  if (p.rating) score += p.rating * 8; // up to +40
  if (p.reviews && p.reviews >= 20) score += 8;
  if (p.reviews && p.reviews >= 100) score += 7;
  if (p.phone) score += 5;
  return Math.round(score);
}

export function buildResults(
  places: PlaceResult[],
  videoStatuses: Map<string, VideoStatus>,
  location: string,
  categorySlug: string,
  fewResults: boolean,
): SearchResults {
  const category = getCategory(categorySlug);
  const opener = category?.opener ?? GENERIC_OPENER;
  const noWebsiteOpener =
    "Your reviews are brilliant — but I couldn't find a website or any video for you online. I'm a local filmmaker, and a short brand film (plus somewhere to put it) could change how new customers find you.";

  const toProspect = (
    p: PlaceResult,
    videoStatus: VideoStatus,
    openerText = opener,
  ): Prospect => ({
    id: p.id,
    name: p.name,
    website: p.website,
    phone: p.phone,
    address: p.address,
    rating: p.rating,
    reviews: p.reviews,
    videoStatus,
    score: scoreProspect(p, videoStatus),
    opener: openerText,
  });

  const withSite = places.filter((p) => isRealWebsite(p.website));
  const withoutSite = places.filter((p) => !isRealWebsite(p.website));

  const prospects = withSite
    .map((p) => toProspect(p, videoStatuses.get(p.id) ?? "unchecked"))
    .filter((p) => p.videoStatus !== "found")
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const noWebsite = withoutSite
    .map((p) => toProspect({ ...p, website: null }, "none", noWebsiteOpener))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  return {
    location,
    categoryLabel: category?.label ?? "Local businesses",
    totalFound: places.length,
    checkedCount: withSite.length,
    prospects,
    noWebsite,
    fewResults,
    createdAt: Date.now(),
  };
}
