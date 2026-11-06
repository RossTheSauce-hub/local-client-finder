export interface Country {
  /** Form value / short code, e.g. "UK". */
  code: string;
  /** Full name appended to the Places search text, e.g. "United Kingdom". */
  name: string;
  /** Google Places regionCode (ISO 3166-1 alpha-2), e.g. "GB". */
  regionCode: string;
  /** Location-input placeholder, tuned to how that country writes addresses. */
  placeholder: string;
}

export const COUNTRIES: Country[] = [
  {
    code: "UK",
    name: "United Kingdom",
    regionCode: "GB",
    placeholder: "Postcode or town — e.g. BS1 or Sheffield",
  },
  {
    code: "US",
    name: "United States",
    regionCode: "US",
    placeholder: "ZIP code or city — e.g. 78701 or Austin, TX",
  },
  {
    code: "CA",
    name: "Canada",
    regionCode: "CA",
    placeholder: "Postal code or city — e.g. M5V or Toronto, ON",
  },
  {
    code: "AU",
    name: "Australia",
    regionCode: "AU",
    placeholder: "Postcode or city — e.g. 3000 or Melbourne, VIC",
  },
  {
    code: "NZ",
    name: "New Zealand",
    regionCode: "NZ",
    placeholder: "Postcode or city — e.g. 6011 or Wellington",
  },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
