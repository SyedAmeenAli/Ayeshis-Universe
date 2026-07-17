export const OUR_SONG_CAPTIONS = [
  "You entered my life quietly.",
  "Then somehow became present in everything.",
  "In long drives.",
  "In unfinished conversations.",
  "In songs I would not have understood the same way before you.",
  "In every ordinary day that became worth remembering.",
  "Before I knew what this would become, you were simply a girl I met on a Wednesday in September.",
  "There are versions of you the world sees.",
  "And then there are the smaller versions I get to know.",
  "We are not perfect in photographs because we are not perfect outside them either.",
  "We get confused.",
  "We overthink.",
  "We annoy each other.",
  "And somehow, after all of it: hum toh aise hi hai.",
  "I hope there will always be songs that remind me of you.",
  "More than that, I hope there will always be new versions of you for me to discover.",
];

export const OUR_SONG_SEQUENCES = [
  { id: "seq-portrait", asset: { id: "SONG-PORTRAIT-01", purpose: "Calm solo portrait" } },
  { id: "seq-video", asset: { id: "SONG-MOMENT-01", purpose: "Natural moment" } },
  {
    id: "seq-strip",
    items: Array.from({ length: 5 }, (_, i) => ({
      id: `SONG-STRIP-${String(i + 1).padStart(2, "0")}`,
      purpose: "Couple film strip frame",
    })),
  },
  { id: "seq-closeup", asset: { id: "SONG-CLOSEUP-01", purpose: "Favourite close-up" } },
];
