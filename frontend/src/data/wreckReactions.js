/**
 * Wreck Room — reaction lines by damage tier / tool.
 */
export const WRECK_REACTIONS = {
  light: [
    "Ayeshaaa, what did I even do?",
    "Arrey baby, gently!",
    "My beautiful face!",
    "This is boyfriend abuse.",
    "I am telling your mother.",
    "Ayeshi, control.",
    "That was personal.",
    "Okay, I probably deserved that.",
  ],
  medium: [
    "OW! Chota baby!",
    "My life bar is not decorative!",
    "You hit like an angry doctor.",
    "Meku dard hori.",
    "I said sorry already!",
    "Ayesha, this is attempted boyfriend deletion.",
  ],
  heavy: [
    "WHAT WAS THAT?",
    "My ancestors felt that.",
    "Baby boy down! Baby boy down!",
    "You hit me harder than the lift door.",
    "Not the balls again!",
    "Hathim made you do this.",
    "I have one HP left!",
  ],
  scribble: [
    "Why are you drawing on my nose?",
    "At least make me look handsome.",
    "That is not where eyebrows go.",
    "Baby, marker aankh mein gaya.",
    "Are you making me Hathim?",
    "Do not write PUNGUN on my forehead.",
  ],
  ko: [
    "Tell my Wagon R I loved her.",
    "Delete my search history.",
    "My love… remember me as handsome.",
    "I can see the light.",
    "One kiss and I will recover.",
  ],
  revive: [
    "I am alive!",
    "Your baby boy has returned.",
    "No lessons were learned.",
  ],
};

export const WRECK_TOOLS = [
  { key: "marker", label: "Marker", damage: 1, kind: "draw", color: "#8B5CF6" },
  { key: "lipstick", label: "Lipstick", damage: 1, kind: "draw", color: "#F3A7C4" },
  { key: "pillow", label: "Pillow", damage: 2, kind: "throw", color: "#D1C2FF" },
  { key: "tomato", label: "Tomato", damage: 4, kind: "throw", color: "#FF405C" },
  { key: "slipper", label: "Slipper", damage: 7, kind: "throw", color: "#7F7885" },
  { key: "textbook", label: "Medical textbook", damage: 10, kind: "throw", color: "#E6BD6A" },
  { key: "sushi", label: "Sushi", damage: 3, kind: "throw", color: "#F3A7C4" },
  { key: "hammer", label: "Bow hammer", damage: 12, kind: "throw", color: "#B89CFF" },
  { key: "balloon", label: "Water balloon", damage: 3, kind: "throw", color: "#61A8FF" },
  { key: "pungun", label: "PUNGUN stamp", damage: 2, kind: "draw", color: "#F4C25A" },
];
