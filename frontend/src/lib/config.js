/**
 * Section keys tracked for the hidden-scroll eligibility system.
 * At least 4 of these need to be visited before the purple ink clue appears.
 */
export const ELIGIBLE_SECTIONS = [
  "our-story",
  "ayesha",
  "memories",
  "our-song",
  "why-i-love-you",
  "games",
  "safe-space",
  "calendar",
];

export const RELATIONSHIP_START = "2025-09-17T00:00:00Z";

/**
 * The nav destinations, top rail + mobile dock.
 */
export const NAV_ITEMS = [
  { id: "home", label: "Home", path: "/home" },
  { id: "story", label: "Story", path: "/our-story" },
  { id: "memories", label: "Memories", path: "/memories" },
  { id: "why-i-love-you", label: "Why I Love You", path: "/why-i-love-you" },
  { id: "ten-months", label: "Ten Months", path: "/ten-months" },
];

export const SECONDARY_NAV = [
  { id: "our-song", label: "Our Song", path: "/our-song" },
  { id: "ayesha", label: "Ayesha", path: "/ayesha" },
  { id: "ameen", label: "Ameen", path: "/ameen" },
  { id: "wreck-room", label: "Wreck Room", path: "/wreck-room" },
  { id: "safe-space", label: "Safe Space", path: "/safe-space" },
  { id: "calendar", label: "Calendar", path: "/calendar" },
  { id: "games", label: "Games", path: "/games" },
  { id: "settings", label: "Settings", path: "/settings" },
];
