/** GoHighLevel API 2.0 contact upsert. Server-side only. */

interface UpsertParams {
  email: string;
  location?: string;
  category?: string;
}

export async function upsertGhlContact({
  email,
  location,
  category,
}: UpsertParams): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.GHL_PRIVATE_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  const tag = process.env.GHL_TAG ?? "lead-magnet-client-finder";

  if (!token || !locationId) {
    console.warn("[ghl] GHL_PRIVATE_TOKEN / GHL_LOCATION_ID not set — skipping upsert");
    return { ok: false, error: "not_configured" };
  }

  try {
    const res = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        locationId,
        email,
        tags: [tag],
        source: "Local Client Finder",
        customFields: [],
        ...(location || category
          ? {
              // Searched location/category ride along as contact attribution
              attributionSource: {
                campaign: "local-client-finder",
                medium: category ?? "",
                utmContent: location ?? "",
              },
            }
          : {}),
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[ghl] upsert failed ${res.status}: ${body.slice(0, 300)}`);
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[ghl] upsert error:", err);
    return { ok: false, error: "network" };
  }
}
