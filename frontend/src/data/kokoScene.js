/**
 * Find Chota Koko — hidden-object scene.
 * All coords are normalized (0..1) so the scene is fully responsive.
 */
export const KOKO_OBJECTS = [
  { key: "bow", label: "Skull-and-bow", x: 0.12, y: 0.22, radius: 0.035, hint: "It is watching from the shelf.", found_reaction: "The mascot has been located. Or has located you." },
  { key: "tulip", label: "Tulip", x: 0.83, y: 0.68, radius: 0.035, hint: "Where a vase might live.", found_reaction: "A quiet tulip, folded near the window." },
  { key: "ring", label: "Ring", x: 0.42, y: 0.58, radius: 0.028, hint: "A promise near something circular.", found_reaction: "The promise has been recovered." },
  { key: "lift-button", label: "Lift button", x: 0.28, y: 0.44, radius: 0.03, hint: "Floor 4 is calling — but do not press it in real life.", found_reaction: "Floor 4. Do not attempt this in a real lift." },
  { key: "sushi", label: "Sushi roll", x: 0.66, y: 0.35, radius: 0.032, hint: "Meku bhook lagri.", found_reaction: "Meku bhook lagri. Confirmed." },
  { key: "hinge-icon", label: "Hinge match", x: 0.16, y: 0.7, radius: 0.03, hint: "The Wednesday app.", found_reaction: "The beginning, still glowing." },
  { key: "grey-dress", label: "Grey dress", x: 0.9, y: 0.42, radius: 0.038, hint: "The colour that flatters everything.", found_reaction: "A grey outfit, in an editorial pose, alone." },
  { key: "orr-sign", label: "ORR sign", x: 0.05, y: 0.55, radius: 0.028, hint: "Not a real route today.", found_reaction: "GREY-17 was here." },
  { key: "cravery-receipt", label: "Cravery receipt", x: 0.55, y: 0.86, radius: 0.03, hint: "Look near a table's edge.", found_reaction: "Timestamp: contradictory." },
  { key: "potty", label: "Suspicious potty", x: 0.36, y: 0.9, radius: 0.03, hint: "No one is claiming this.", found_reaction: "Certified potty, obviously." },
  { key: "pungun-cassette", label: "Pungun cassette", x: 0.74, y: 0.16, radius: 0.033, hint: "A song nobody consented to.", found_reaction: "Do not press play." },
  { key: "dignity", label: "Ameen's dignity", x: 0.5, y: 0.5, radius: 0.026, hint: "Almost invisible. That is on-brand.", found_reaction: "Unexpected discovery: Ameen's dignity was here the entire time." },
];
