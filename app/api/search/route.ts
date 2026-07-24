import { NextRequest } from "next/server";
import { getCategory } from "@/lib/categories";
import { searchBusinesses, isRealWebsite } from "@/lib/places";
import { checkSitesForVideo } from "@/lib/videoCheck";
import { buildResults } from "@/lib/score";
import {
  cacheKey,
  getCachedSearch,
  setCachedSearch,
  storeResults,
  consumeRateLimit,
} from "@/lib/store";
import type { SearchEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OVERALL_CHECK_TIMEOUT_MS = 20_000;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  let body: { location?: string; category?: string; otherText?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const location = (body.location ?? "").trim().slice(0, 80);
  const categorySlug = (body.category ?? "").trim();
  const otherText = (body.otherText ?? "").trim().slice(0, 60);
  const category = getCategory(categorySlug);

  if (location.length < 2 || !category) {
    return Response.json(
      { error: "Please enter a postcode or town and pick a business type." },
      { status: 400 },
    );
  }
  const searchTerm = category.slug === "other" ? otherText : category.query;
  if (searchTerm.length < 2) {
    return Response.json(
      { error: "Please describe the business type you're after." },
      { status: 400 },
    );
  }

  const key = cacheKey(location, category.slug === "other" ? otherText : category.slug);
  const cached = getCachedSearch(key);

  if (!cached && !consumeRateLimit(clientIp(req))) {
    return Response.json(
      {
        error:
          "You've hit today's limit of 3 searches. Come back tomorrow — your prospects aren't going anywhere.",
      },
      { status: 429 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SearchEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        if (cached) {
          send({ type: "stage", message: `Finding ${category.label.toLowerCase()}s near ${location}…` });
          const searchId = storeResults(cached);
          send({
            type: "done",
            searchId,
            noVideoCount: cached.prospects.length,
            noWebsiteCount: cached.noWebsite.length,
            totalFound: cached.totalFound,
            location: cached.location,
            fewResults: cached.fewResults,
          });
          controller.close();
          return;
        }

        send({ type: "stage", message: `Searching for ${category.label.toLowerCase()}s near ${location}…` });
        const { places, widened } = await searchBusinesses(searchTerm, location);

        if (places.length === 0) {
          send({
            type: "error",
            message: `We couldn't find any businesses matching that near "${location}". Try a nearby bigger town, or check the spelling.`,
            emailFallback: false,
          });
          controller.close();
          return;
        }

        if (widened) {
          send({ type: "stage", message: "Small area — widening the search radius…" });
        }
        send({ type: "stage", message: `Found ${places.length} local businesses. Pulling up their websites…` });

        const withSites = places.filter((p) => isRealWebsite(p.website));
        send({
          type: "stage",
          message: `Checking ${withSites.length} websites for video…`,
        });

        const statuses = await checkSitesForVideo(
          withSites.map((p) => p.website as string),
          OVERALL_CHECK_TIMEOUT_MS,
          (checked) => send({ type: "progress", checked, total: withSites.length }),
        );

        const statusMap = new Map(withSites.map((p, i) => [p.id, statuses[i]]));
        send({ type: "stage", message: "Ranking your warmest prospects…" });

        const results = buildResults(
          places,
          statusMap,
          location,
          category.slug,
          places.length < 8,
        );
        setCachedSearch(key, results);
        const searchId = storeResults(results);

        send({
          type: "done",
          searchId,
          noVideoCount: results.prospects.length,
          noWebsiteCount: results.noWebsite.length,
          totalFound: results.totalFound,
          location: results.location,
          fewResults: results.fewResults,
        });
      } catch (err) {
        console.error("[search] failed:", err);
        send({
          type: "error",
          message:
            "We hit a snag pulling live business data. Leave your email below and we'll run the search for you and send your list.",
          emailFallback: true,
        });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
