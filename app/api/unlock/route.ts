import { NextRequest } from "next/server";
import { upsertGhlContact } from "@/lib/ghl";
import { open } from "@/lib/seal";
import type { SearchResults } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  let body: {
    email?: string;
    token?: string;
    location?: string;
    category?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase().slice(0, 120);
  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "That doesn't look like a valid email — check it and try again." },
      { status: 400 },
    );
  }

  // Capture the lead first — even if results have expired, the email lands in GHL.
  const ghl = await upsertGhlContact({
    email,
    location: body.location,
    category: body.category,
  });
  if (!ghl.ok) {
    // Don't block the user on a CRM hiccup; log it and carry on.
    console.error(`[unlock] GHL upsert failed for ${email}: ${ghl.error}`);
  }

  const courseUrl = process.env.COURSE_URL ?? "#";

  if (!body.token) {
    // Fallback path (search failed earlier): email captured, no results to show.
    return Response.json({ ok: true, results: null, courseUrl });
  }

  const results = open<SearchResults>(body.token);
  if (!results) {
    return Response.json(
      {
        ok: true,
        results: null,
        courseUrl,
        expired: true,
        error:
          "Your search expired — run it again (it'll be instant, we cached it).",
      },
      { status: 200 },
    );
  }

  return Response.json({ ok: true, results, courseUrl });
}
