export type VideoStatus = "none" | "found" | "unchecked";

export interface Prospect {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  videoStatus: VideoStatus;
  score: number;
  opener: string;
}

export interface SearchResults {
  location: string;
  categoryLabel: string;
  totalFound: number;
  checkedCount: number;
  /** Top prospects: have a website, no video found (or couldn't check). Max 10. */
  prospects: Prospect[];
  /** Businesses with no website at all — even warmer. Max 3. */
  noWebsite: Prospect[];
  /** True when even the widened search returned very few results. */
  fewResults: boolean;
  createdAt: number;
}

/** Events streamed from /api/search as NDJSON lines. */
export type SearchEvent =
  | { type: "stage"; message: string }
  | { type: "progress"; checked: number; total: number }
  | {
      type: "done";
      /** Sealed (encrypted) results token; returned to /api/unlock with the email. */
      token: string;
      noVideoCount: number;
      noWebsiteCount: number;
      totalFound: number;
      location: string;
      fewResults: boolean;
    }
  | { type: "error"; message: string; emailFallback: boolean };
