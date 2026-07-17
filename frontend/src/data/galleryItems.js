/**
 * Editorial gallery sections for /ayesha and /ameen.
 * Each item's asset id is hashed into a real photo automatically by
 * AssetPlaceholder (see lib/realAssets.js) — no manual filename wiring.
 */

export const AYESHA_SECTIONS = [
  {
    key: "cover",
    label: "Cover Girl",
    kicker: "ISSUE 01 · PRIVATE EDITION / 1709",
    items: [{ id: "AYESHA-COVER-01", purpose: "Full-screen cover portrait" }],
  },
  {
    key: "grey",
    label: "Grey Looks Better on Her",
    kicker: "MONOCHROME",
    items: Array.from({ length: 6 }, (_, i) => ({
      id: `AYESHA-GREY-${String(i + 1).padStart(2, "0")}`,
      purpose: "Grey outfit study",
    })),
  },
  {
    key: "fashion",
    label: "Dresses, Kurtis & Cute Tops",
    kicker: "EDITORIAL",
    items: Array.from({ length: 8 }, (_, i) => ({
      id: `AYESHA-FASHION-${String(i + 1).padStart(2, "0")}`,
      purpose: "Fashion story",
    })),
  },
  {
    key: "face",
    label: "Face Card Department",
    kicker: "CLOSE-UPS",
    items: Array.from({ length: 6 }, (_, i) => ({
      id: `AYESHA-FACE-${String(i + 1).padStart(2, "0")}`,
      purpose: "Close-up, glasses, expression",
    })),
  },
  {
    key: "unnecessary",
    label: "Unnecessarily Beautiful",
    kicker: "CASUAL",
    items: Array.from({ length: 6 }, (_, i) => ({
      id: `AYESHA-CASUAL-${String(i + 1).padStart(2, "0")}`,
      purpose: "Unposed, natural",
    })),
  },
  {
    key: "favourites",
    label: "Ameen's Favourite Versions",
    kicker: "TAP TO REVEAL",
    items: [
      { id: "AYESHA-FAV-01", purpose: "Favourite", note: "This one, always this one." },
      { id: "AYESHA-FAV-02", purpose: "Favourite", note: "You don't know this is my favourite yet." },
      { id: "AYESHA-FAV-03", purpose: "Favourite", note: "The one where you weren't posing." },
      { id: "AYESHA-FAV-04", purpose: "Favourite", note: "I still open this one sometimes." },
    ],
  },
  {
    key: "medical",
    label: "Medical Main Character",
    kicker: "WHITE COAT",
    items: Array.from({ length: 4 }, (_, i) => ({
      id: `AYESHA-MEDICAL-${String(i + 1).padStart(2, "0")}`,
      purpose: "College / doctor-track",
    })),
  },
];

export const AMEEN_SECTIONS = [
  {
    key: "trying",
    label: "Ameen Attempting to Look Good",
    kicker: "EFFORT: VISIBLE",
    items: Array.from({ length: 6 }, (_, i) => ({
      id: `AMEEN-TRYING-${String(i + 1).padStart(2, "0")}`,
      purpose: "Trying his best",
    })),
  },
  {
    key: "baby",
    label: "Baby-Boy Evidence",
    kicker: "EXHIBIT A",
    items: Array.from({ length: 5 }, (_, i) => ({
      id: `AMEEN-BABY-${String(i + 1).padStart(2, "0")}`,
      purpose: "Undeniable baby boy energy",
    })),
  },
  {
    key: "questionable",
    label: "Questionable Fashion Decisions",
    kicker: "NO NOTES",
    items: Array.from({ length: 5 }, (_, i) => ({
      id: `AMEEN-FASHION-${String(i + 1).padStart(2, "0")}`,
      purpose: "Questionable outfit",
    })),
  },
  {
    key: "certified",
    label: "Girlfriend-Certified",
    kicker: "APPROVED",
    items: Array.from({ length: 5 }, (_, i) => ({
      id: `AMEEN-CERTIFIED-${String(i + 1).padStart(2, "0")}`,
      purpose: "Approved by Ayesha",
    })),
  },
];

export const AMEEN_RATINGS = [
  { id: "cute", label: "Cute" },
  { id: "handsome", label: "Handsome" },
  { id: "baby_boy", label: "Baby boy" },
  { id: "remove_immediately", label: "Remove this immediately" },
  { id: "certified_potty", label: "Certified potty" },
];
