import type { VideoStatus } from "./types";

const VIDEO_PATTERNS: RegExp[] = [
  /<video[\s>]/i,
  /youtube\.com\/(embed|watch|shorts|v\/)/i,
  /youtube-nocookie\.com/i,
  /youtu\.be\//i,
  /player\.vimeo\.com/i,
  /vimeo\.com\/\d+/i,
  /wistia\.(com|net)/i,
  /loom\.com\/(share|embed)/i,
  /videopress\.com/i,
  /\.(mp4|webm|m3u8)["'?\s]/i,
  // Nav / section signals: link or heading text mentioning video content
  />[^<]{0,60}\b(showreel|show reel|our films?|watch (our|the) (film|video)|video tour|videography)\b[^<]{0,60}</i,
];

const FETCH_TIMEOUT_MS = 5_000;
const MAX_HTML_BYTES = 600_000;
const CONCURRENCY = 8;

function normaliseUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Fetch a homepage and scan the HTML for video signals. */
export async function checkSiteForVideo(
  url: string,
  deadline: number,
): Promise<VideoStatus> {
  const remaining = deadline - Date.now();
  if (remaining < 500) return "unchecked";

  try {
    const res = await fetch(normaliseUrl(url), {
      redirect: "follow",
      signal: AbortSignal.timeout(Math.min(FETCH_TIMEOUT_MS, remaining)),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });
    if (!res.ok) return "unchecked";

    const html = (await res.text()).slice(0, MAX_HTML_BYTES);
    return VIDEO_PATTERNS.some((re) => re.test(html)) ? "found" : "none";
  } catch {
    return "unchecked";
  }
}

/**
 * Check many sites concurrently with a shared overall deadline.
 * Calls onProgress after each site completes. Never throws.
 */
export async function checkSitesForVideo(
  urls: string[],
  overallTimeoutMs: number,
  onProgress: (checked: number) => void,
): Promise<VideoStatus[]> {
  const deadline = Date.now() + overallTimeoutMs;
  const results: VideoStatus[] = new Array(urls.length).fill("unchecked");
  let next = 0;
  let checked = 0;

  async function worker() {
    while (next < urls.length) {
      const i = next++;
      results[i] = await checkSiteForVideo(urls[i], deadline);
      onProgress(++checked);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker),
  );
  return results;
}
