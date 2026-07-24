export interface Category {
  slug: string;
  label: string;
  /** Search phrase sent to Google Places text search. Empty = user supplies free text. */
  query: string;
  /** One-line opener suggestion, personalised per trade. */
  opener: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "tattoo",
    label: "Tattoo Studio",
    query: "tattoo studio",
    opener:
      "Your artists' work looks great — but I noticed there's no video on your site. I'm a local filmmaker and I make short studio films that show clients what getting tattooed with you actually feels like.",
  },
  {
    slug: "gym",
    label: "Gym / Fitness Studio",
    query: "gym fitness studio",
    opener:
      "Your gym looks great — but I noticed there's no video on your site. I'm a local filmmaker and I make short films that show people the atmosphere before they ever walk in, which is what actually sells memberships.",
  },
  {
    slug: "cafe",
    label: "Café / Coffee Shop",
    query: "independent cafe coffee shop",
    opener:
      "Your café looks great — but I noticed there's no video on your site. I'm a local filmmaker and I make short brand films that capture the feel of a place better than any photo can.",
  },
  {
    slug: "barber",
    label: "Barber / Salon",
    query: "barber shop hair salon",
    opener:
      "Your work looks great — but I noticed there's no video on your site. I'm a local filmmaker and I make short films for barbers and salons that turn browsers into bookings.",
  },
  {
    slug: "estate-agent",
    label: "Estate Agent",
    query: "independent estate agent",
    opener:
      "I noticed there's no video on your site — and listings with video get far more enquiries. I'm a local filmmaker and I shoot property and brand films for agents like you.",
  },
  {
    slug: "tradesperson",
    label: "Tradesperson",
    query: "builder plumber electrician",
    opener:
      "Your work speaks for itself — but I noticed there's no video on your site. I'm a local filmmaker and I make short before-and-after films that win tradespeople bigger jobs.",
  },
  {
    slug: "restaurant",
    label: "Restaurant",
    query: "independent restaurant",
    opener:
      "Your food looks great — but I noticed there's no video on your site. I'm a local filmmaker and I make short films that make people hungry before they've even seen the menu.",
  },
  {
    slug: "physio",
    label: "Physio / Wellness",
    query: "physiotherapy wellness clinic",
    opener:
      "Your clinic looks great — but I noticed there's no video on your site. I'm a local filmmaker and I make short films that build the trust new patients need before booking.",
  },
  {
    slug: "creative",
    label: "Creative Studio",
    query: "photography studio creative agency",
    opener:
      "Your portfolio looks great — but I noticed there's no video on your site. I'm a local filmmaker and I partner with studios like yours to add motion to what you already offer clients.",
  },
  {
    slug: "other",
    label: "Other…",
    query: "",
    opener:
      "Your work looks great — I noticed there's no video on your site. I'm a local filmmaker and I make short brand films for businesses like yours.",
  },
];

export const GENERIC_OPENER = CATEGORIES[CATEGORIES.length - 1].opener;

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
