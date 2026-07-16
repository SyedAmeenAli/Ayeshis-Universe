/**
 * CASE 1709 — all five acts, puzzles, hints, evidence, phone content.
 * Kept as data so components stay small.
 */

// -------------------- Meta --------------------
export const CASE_META = {
  key: "case-1709",
  title: "CASE 1709",
  antagonist: "THE ARCHIVIST",
  archivist_hail: [
    "Your boyfriend is alive.",
    "Whether he remains identifiable depends on you.",
    "I have studied ten months of your history.",
    "You remember affection.",
    "I remember evidence.",
    "Recover him before CASE 1709 is permanently closed.",
  ],
  acts: [
    { key: "act-i", label: "Act I — Compromised Phone", est: "15–20 min" },
    { key: "act-ii", label: "Act II — Cravery Reconstruction", est: "20–25 min" },
    { key: "act-iii", label: "Act III — Medical College", est: "25–30 min" },
    { key: "act-iv", label: "Act IV — ORR Pursuit", est: "20–25 min" },
    { key: "act-v", label: "Act V — GREY-17", est: "20–25 min" },
  ],
};

// -------------------- Answer normalisers --------------------
export function normaliseCaseAnswer(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[\s/\-]+/g, "")
    .trim();
}

export function normaliseDateAnswer(raw, target) {
  // target is DDMMYY expected form
  const cleaned = normaliseCaseAnswer(raw);
  // Accept DDMMYY, DDMMYYYY, YYYYMMDD, "DD Month YYYY", "DDth Month YYYY"
  if (cleaned === target.toLowerCase()) return true;
  // Extract digits
  const digits = cleaned.replace(/[^0-9]/g, "");
  const targetDigits = target.replace(/[^0-9]/g, "");
  if (digits === targetDigits) return true;
  // Try DDMMYYYY vs DDMMYY
  if (digits.length === 8 && digits.startsWith(targetDigits.slice(0, 4)) && digits.slice(4) === "20" + targetDigits.slice(4)) return true;
  // Try YYYYMMDD
  if (digits.length === 8) {
    const yyyymmdd = digits;
    const y = yyyymmdd.slice(0, 4);
    const m = yyyymmdd.slice(4, 6);
    const d = yyyymmdd.slice(6, 8);
    if (d + m + y.slice(2) === targetDigits) return true;
  }
  // Word month
  const monthMap = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06", july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" };
  const wordMatch = cleaned.match(/^(\d{1,2})(st|nd|rd|th)?(january|february|march|april|may|june|july|august|september|october|november|december)(\d{4})$/i);
  if (wordMatch) {
    const dd = wordMatch[1].padStart(2, "0");
    const mm = monthMap[wordMatch[3].toLowerCase()];
    const yy = wordMatch[4].slice(2);
    if (dd + mm + yy === targetDigits) return true;
  }
  return false;
}

// -------------------- Phone content --------------------
export const PHONE_APPS = [
  { key: "messages", label: "Messages", icon: "💬" },
  { key: "phone", label: "Phone", icon: "📞" },
  { key: "contacts", label: "Contacts", icon: "👤" },
  { key: "gallery", label: "Gallery", icon: "🖼️" },
  { key: "camera", label: "Camera", icon: "📷" },
  { key: "files", label: "Files", icon: "📁" },
  { key: "notes", label: "Notes", icon: "📝" },
  { key: "maps", label: "Maps", icon: "🗺️" },
  { key: "browser", label: "Browser", icon: "🌐" },
  { key: "mail", label: "Mail", icon: "✉️" },
  { key: "calculator", label: "Calculator", icon: "🧮" },
  { key: "settings", label: "Settings", icon: "⚙️" },
  { key: "notif", label: "Deleted Notifications", icon: "🔔" },
  { key: "terminal", label: "Archive Terminal", icon: "▮" },
  { key: "board", label: "Evidence Board", icon: "▦" },
  { key: "ghost", label: "Ghost_17", icon: "◐" },
  { key: "logs", label: "System Logs", icon: "≡" },
];

export const PHONE_MESSAGES = [
  {
    thread: "ayesha",
    contact: "Ayesha ♡",
    preview: "did you eat",
    messages: [
      { from: "them", text: "did you eat", ts: "22:41" },
      { from: "me", text: "not yet", ts: "22:42" },
      { from: "them", text: "eat something now", ts: "22:42" },
      { from: "me", text: "yes ma'am", ts: "22:43" },
      { from: "them", text: "hum toh aise hi hai", ts: "22:45" },
    ],
  },
  {
    thread: "hathim",
    contact: "Hathim",
    preview: "bro. help.",
    messages: [
      { from: "them", text: "bro. help.", ts: "20:12" },
      { from: "me", text: "with what", ts: "20:13" },
      { from: "them", text: "nothing", ts: "20:13" },
      { from: "them", text: "actually forget it", ts: "20:14" },
    ],
  },
  {
    thread: "unknown",
    contact: "Unknown",
    preview: "Access confirmed. Subject 1709 acquired.",
    corrupted: true,
    messages: [
      { from: "them", text: "Access confirmed. Subject 1709 acquired.", ts: "23:41" },
      { from: "them", text: "Archive protocols engaged.", ts: "23:42" },
      { from: "them", text: "Do not attempt manual recovery.", ts: "23:43" },
    ],
  },
  {
    thread: "cravery",
    contact: "Cravery Reservations",
    preview: "Your table is ready.",
    messages: [
      { from: "them", text: "Your table is ready for 2 at 20:00.", ts: "19:45" },
    ],
  },
];

export const PHONE_CONTACTS = [
  { key: "ayesha", label: "Ayesha ♡", subtitle: "Girlfriend, verified", pinnable: false },
  { key: "hathim", label: "Hathim", subtitle: "Concerning", pinnable: true },
  { key: "cravery", label: "Cravery Café", subtitle: "First-date location", pinnable: true },
  { key: "unknown", label: "Unknown", subtitle: "No caller ID", pinnable: true },
  { key: "ghost17", label: "Ghost_17", subtitle: "Corrupted contact", pinnable: true, corrupted: true },
  { key: "mom", label: "Amma", subtitle: "Mother", pinnable: false },
  { key: "wagon", label: "Wagon R", subtitle: "Car service", pinnable: false },
];

export const PHONE_NOTES = [
  { key: "n1", title: "song list", body: "Pocahontas — Colors of the Wind. Add to Our Song. Do not tell Ayesha the title." },
  { key: "n2", title: "grocery", body: "Wasabi. Ginger. Emergency sushi." },
  { key: "n3", title: "codes", body: "Firewall: date of first kiss. DDMMYY.\nPromise firewall: DDMMYY of promise.\nBehavioural checksum: hum toh aise hi hai." },
  { key: "n4", title: "hathim.txt", body: "Do not let Hathim near your food. Do not let Hathim near your keys. Do not let Hathim near your girlfriend's phone." },
  { key: "n5", title: "note-1709", body: "If you are reading this, the Archivist has already begun. Trust behavioural checksums, not evidence. — Ghost_17" },
];

export const PHONE_FILES = [
  { key: "pungun-bin", name: "PUNGUN.bin", type: "binary", locked: false },
  { key: "hathim-alibi", name: "HATHIM_ALIBI.enc", type: "encrypted", locked: true },
  { key: "cctv-cravery", name: "cctv-cravery.zip", type: "archive", locked: false },
  { key: "letters", name: "letters.rtf", type: "text", locked: false },
  { key: "ghost", name: "ghost17.bak", type: "backup", locked: true },
];

// PUNGUN.bin — ASCII "HUM TOH AISE HI HAI" in binary
export const PUNGUN_BINARY =
  "01001000 01010101 01001101 00100000 01010100 01001111 01001000 00100000 01000001 01001001 01010011 01000101 00100000 01001000 01001001 00100000 01001000 01000001 01001001";

// -------------------- Terminal --------------------
export const TERMINAL_HELP = [
  "> help          show commands",
  "> ls            list evidence",
  "> cat FILE      show file",
  "> decode FILE   decode a file",
  "> unlock DIR    attempt to unlock",
  "> whois         request identity",
  "> clear         clear screen",
];

// -------------------- Act I --------------------
export const ACT_I = {
  key: "act-i",
  puzzles: [
    {
      key: "firewall",
      title: "Relationship Firewall",
      prompt: "Enter the date when physical distance between the subjects first disappeared.",
      hints: [
        "It is not the date of the match.",
        "October. A quiet Saturday.",
        "The kiss. DDMMYY.",
      ],
      answer_target: "111025",
      kind: "date",
    },
    {
      key: "pungun",
      title: "PUNGUN.bin",
      prompt: "Decode the binary. Enter the phrase.",
      hints: [
        "Split on spaces. Each block is 8 bits.",
        "Try ASCII conversion.",
        "The phrase explains nothing and everything.",
      ],
      answer_target: "humtohaisehihai",
      kind: "phrase",
    },
    {
      key: "hathim",
      title: "Hathim Red Herring",
      prompt: "HATHIM_ALIBI.enc — password required.",
      hints: [
        "What is Hathim made of?",
        "It is not gold.",
        "The answer is 'potty'.",
      ],
      answer_target: "potty",
      kind: "password",
      followUp: {
        prompt: "You need to inspect three contradictions before submitting a conclusion.",
        contradictions: [
          { key: "ts", label: "Metadata timestamp says 22:31 PM." },
          { key: "clock", label: "Visible clock reads 21:48 PM." },
          { key: "sign", label: "Café sign in reflection: 'CRAVERY'." },
          { key: "author", label: "Editor metadata: ARCHIVIST_NODE." },
          { key: "gps", label: "GPS metadata was scrubbed. Recovered: CRAVERY." },
        ],
        options: [
          { id: "framed", label: "Hathim's evidence was manipulated" },
          { id: "guilty", label: "Hathim is responsible" },
          { id: "irrelevant", label: "The image is irrelevant" },
        ],
        correct: "framed",
      },
    },
    {
      key: "notif",
      title: "Notification Timeline",
      prompt: "Reorder deleted notifications chronologically.",
      hints: [
        "Some timestamps are AM, some PM.",
        "Read the first letter of each notification in order.",
        "Chronological order spells the next location.",
      ],
      answer_target: "cravery",
      kind: "reorder",
      items: [
        { id: "c", ts: "07:12", label: "Cravery reservation confirmed", letter: "C" },
        { id: "r", ts: "10:44", label: "Ride booked — 4-seater", letter: "R" },
        { id: "a", ts: "13:30", label: "Ayesha is 5 minutes away", letter: "A" },
        { id: "v", ts: "14:02", label: "Video call missed", letter: "V" },
        { id: "e", ts: "16:15", label: "Email from CRAVERY_LOYALTY", letter: "E" },
        { id: "r2", ts: "18:47", label: "Return delivery to CRAVERY failed", letter: "R" },
        { id: "y", ts: "21:03", label: "Yellow package left at reception", letter: "Y" },
      ],
      correctOrder: ["c", "r", "a", "v", "e", "r2", "y"],
    },
  ],
};

// -------------------- Act II --------------------
export const ACT_II = {
  key: "act-ii",
  puzzles: [
    {
      key: "cctv",
      title: "CCTV Sequence",
      prompt: "Order the twelve stills chronologically.",
      hints: [
        "The rain begins somewhere in the middle.",
        "The lift incident is not at the end.",
        "A delivery worker enters after the drinks arrive.",
      ],
      stills: [
        { id: "s01", label: "Ameen enters" },
        { id: "s02", label: "Ayesha enters" },
        { id: "s03", label: "Seated across the table" },
        { id: "s04", label: "Ayesha laughing" },
        { id: "s05", label: "Both stand, approach lift" },
        { id: "s06", label: "Hand between the doors" },
        { id: "s07", label: "Doors closing on hand" },
        { id: "s08", label: "Ameen pretends he is fine" },
        { id: "s09", label: "Delivery worker enters" },
        { id: "s10", label: "Package label visible" },
        { id: "s11", label: "Medical-college symbol reflected" },
        { id: "s12", label: "Figure watching in background" },
      ],
      correctOrder: ["s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09", "s10", "s11", "s12"],
    },
    {
      key: "lift",
      title: "Lift Incident",
      prompt: "Which floor did the lift try to serve?",
      hints: [
        "The waveform has four peaks.",
        "Not the top floor.",
        "Four peaks. Four.",
      ],
      answer_target: "4",
      kind: "choice",
      choices: ["1", "2", "3", "4", "5", "6", "7", "8"],
      reveal: "Locker 3657",
    },
    {
      key: "spectro",
      title: "Spectrogram",
      prompt: "Apply the correct transformation sequence to read the message.",
      hints: [
        "The image is upside down.",
        "Try rotating 180°.",
        "Rotate 180° then invert.",
      ],
      sequence: ["rotate180", "invert"],
      reveal: "NORTH STAIR / THIRD FLOOR / 23:40",
    },
    {
      key: "receipt",
      title: "Receipt Cipher",
      prompt: "Arrange four receipts chronologically. Read the hidden letter of each.",
      hints: [
        "Dates: 17 Sep, 25 Sep, 11 Oct, 12 Dec.",
        "One letter is on each receipt.",
        "Correct order spells NORTH.",
      ],
      items: [
        { id: "sep17", date: "2025-09-17", letter: "N" },
        { id: "sep25", date: "2025-09-25", letter: "O" },
        { id: "oct11", date: "2025-10-11", letter: "R" },
        { id: "dec12", date: "2025-12-12", letter: "TH" }, // last one contributes "TH" for spelling flavour
      ],
      correctOrder: ["sep17", "sep25", "oct11", "dec12"],
      answer_target: "north",
    },
  ],
};

// -------------------- Act III --------------------
export const ACT_III = {
  key: "act-iii",
  puzzles: [
    {
      key: "toxidrome",
      title: "Toxidrome Diagnosis",
      prompt: "The patient shows the following signs. Which toxidrome?",
      symptoms: [
        "Marked miosis",
        "Sweating",
        "Excessive secretions",
        "Bradycardia",
        "Muscle fasciculations",
        "Abdominal cramping",
        "Confusion",
      ],
      required_selection: 3,
      choices: [
        { id: "op", label: "Opioid exposure" },
        { id: "anti", label: "Anticholinergic toxicity" },
        { id: "orgp", label: "Organophosphate exposure" },
        { id: "symp", label: "Sympathomimetic toxicity" },
      ],
      correct: "orgp",
      hints: [
        "Muscarinic + nicotinic activation.",
        "Anticholinergic looks the opposite.",
        "Organophosphates.",
      ],
    },
    {
      key: "cabinet",
      title: "Fictional Cabinet Code",
      prompt: "ACCESS VALUE = (muscarinic × nicotinic) + patient file number. Muscarinic = 6, Nicotinic = 2, File = 17. Enter as 4-digit code.",
      hints: [
        "6 × 2 = 12.",
        "12 + 17 = 29.",
        "Pad to four digits.",
      ],
      answer_target: "0029",
      kind: "code",
    },
    {
      key: "willis",
      title: "Circle of Willis",
      prompt: "Place labels correctly around the anterior/posterior circulation to reveal a code.",
      labels: ["ACA", "AComm", "ICA", "PComm", "PCA", "Basilar"],
      slots: ["A", "B", "C", "D", "E", "F"],
      correct_map: { A: "ACA", B: "AComm", C: "ICA", D: "PComm", E: "PCA", F: "Basilar" },
      answer_target: "1709",
      hints: [
        "AComm connects the two ACAs at the top.",
        "PComm sits between ICA and PCA.",
        "Anterior first, posterior after.",
      ],
    },
    {
      key: "cranial",
      title: "Cranial Nerve",
      prompt: "Ptosis, dilated pupil, eye down-and-out, impaired adduction, impaired elevation. Which nerve?",
      choices: [
        { id: "cn3", label: "Oculomotor — CN III" },
        { id: "cn4", label: "Trochlear — CN IV" },
        { id: "cn6", label: "Abducens — CN VI" },
        { id: "cn7", label: "Facial — CN VII" },
      ],
      correct: "cn3",
      hints: [
        "Loss of parasympathetic supply → dilated pupil.",
        "Down and out on inspection.",
        "Third cranial nerve.",
      ],
    },
    {
      key: "mechanism",
      title: "Mechanism Grid",
      prompt: "Match each drug class with its fictional mechanism card.",
      pairs: [
        { drug: "Atropine", mech: "Competitive muscarinic antagonist" },
        { drug: "Pralidoxime", mech: "AChE reactivator" },
        { drug: "Naloxone", mech: "Opioid antagonist" },
        { drug: "Diazepam", mech: "GABA-A benzodiazepine site" },
        { drug: "Esmolol", mech: "β1-adrenergic blocker" },
      ],
      hints: [
        "Atropine ≠ opioid antagonist.",
        "Pralidoxime reactivates the enzyme.",
        "GABA + benzo → seizure control.",
      ],
      answer_target: "orr",
    },
  ],
};

// -------------------- Act IV --------------------
export const ACT_IV = {
  key: "act-iv",
  puzzles: [
    {
      key: "vehicle",
      title: "Vehicle Identification",
      prompt: "Identify the correct vehicle.",
      vehicles: [
        { id: "v1", tail: false, bow: false, sleeve: false, plate: "AA-01-****", note: "Silver hatchback" },
        { id: "v2", tail: true, bow: true, sleeve: true, plate: "TS-17-XX09", note: "Grey sedan, broken tail-light" },
        { id: "v3", tail: false, bow: true, sleeve: false, plate: "KA-09-1234", note: "Black SUV" },
        { id: "v4", tail: true, bow: false, sleeve: false, plate: "MH-14-5678", note: "White hatchback" },
        { id: "v5", tail: false, bow: false, sleeve: true, plate: "TS-08-****", note: "Grey sedan" },
        { id: "v6", tail: true, bow: true, sleeve: false, plate: "AP-16-9990", note: "Grey sedan" },
      ],
      required: { tail: true, bow: true, sleeve: true },
      correct: "v2",
      hints: [
        "Broken tail-light narrows it fast.",
        "Bow reflection in the door.",
        "Grey cloth near the rear.",
      ],
    },
    {
      key: "route",
      title: "Route Reconstruction",
      prompt: "One of the timestamps is impossible. Remove it, then submit the route.",
      checkpoints: [
        { id: "A", time: "23:51", note: "Toll gate A" },
        { id: "B", time: "00:04", note: "Toll gate B" },
        { id: "C", time: "00:19", note: "Toll gate C" },
        { id: "D", time: "00:22", note: "Camera D — shadow inconsistency, ARCHIVIST watermark", manipulated: true },
        { id: "E", time: "00:47", note: "Warehouse turnoff" },
      ],
      wrong: "D",
      answer_target: "grey-17",
      hints: [
        "Compare travel time between checkpoints.",
        "One shadow does not match the sun position.",
        "Look for the ARCHIVIST watermark.",
      ],
    },
    {
      key: "packet",
      title: "Packet Capture",
      prompt: "Filter and inspect. Decode the surviving packet.",
      hints: [
        "source = AMEEN_PHONE, status = failed, protocol = archive.",
        "One packet survives filtering.",
        "Base64. Decode it.",
      ],
      packets: [
        { id: 1, src: "AMEEN_PHONE", status: "failed", proto: "http", payload: "" },
        { id: 2, src: "ARCHIVIST_NODE", status: "success", proto: "archive", payload: "" },
        { id: 3, src: "AMEEN_PHONE", status: "failed", proto: "archive", payload: "VEhFIERBVEUgSEUgU1RPUFBFRCBBU0tJTkcKQU5EIFNUQVJURUQgUFJPTUlTSU5H" },
        { id: 4, src: "HATHIM_PHONE", status: "failed", proto: "sms", payload: "" },
      ],
      // decodes to: THE DATE HE STOPPED ASKING\nAND STARTED PROMISING
      answer_target: "121225",
      firewall_prompt: "Ghost_17 firewall — enter the promise date (DDMMYY).",
    },
    {
      key: "steg",
      title: "Steganography",
      prompt: "Isolate blue, invert. Read the hidden text.",
      steps: ["blue", "invert"],
      reveal: "GREY 17 / ENTRY B",
      hints: [
        "Colour channels separate hidden content.",
        "Try isolating one channel.",
        "Blue channel + invert.",
      ],
    },
  ],
};

// -------------------- Act V --------------------
export const ACT_V = {
  key: "act-v",
  puzzles: [
    {
      key: "cabinets",
      title: "Four Memory Cabinets",
      cabinets: [
        { key: "A", prompt: "The beginning.", answer_target: "170925" },
        { key: "B", prompt: "The first moment neither looked away.", answer_target: "111025" },
        { key: "C", prompt: "The promise.", answer_target: "121225" },
        { key: "D", prompt: "The phrase that explains nothing and everything.", answer_target: "humtohaisehihai" },
      ],
      hints: [
        "Cabinet A: the Wednesday.",
        "Cabinet B: October.",
        "Cabinet C: December.",
      ],
    },
    {
      key: "contradictions",
      title: "Contradiction Board",
      cards: [
        { id: "receipt", label: "Cravery receipt", correct: "real" },
        { id: "hathim", label: "Hathim alibi", correct: "manipulated" },
        { id: "lift", label: "Lift report", correct: "real" },
        { id: "locker", label: "Medical-college locker", correct: "manipulated" },
        { id: "symp", label: "Organophosphate symptoms", correct: "manipulated" },
        { id: "orr", label: "ORR camera", correct: "real" },
        { id: "pungun", label: "Pungun binary", correct: "real" },
        { id: "proposal", label: "Proposal date", correct: "real" },
        { id: "ghost", label: "Ghost_17 messages", correct: "unverified" },
        { id: "watermark", label: "Archivist watermark", correct: "manipulated" },
      ],
      classes: [
        { key: "real", label: "Real Memory" },
        { key: "manipulated", label: "Manipulated Evidence" },
        { key: "unverified", label: "Unverified Assumption" },
      ],
    },
    {
      key: "identity",
      title: "Archivist Identity",
      prompt: "Who is the Archivist, truly?",
      choices: [
        { id: "hathim", label: "Hathim" },
        { id: "criminal", label: "An unknown criminal" },
        { id: "synthetic", label: "A synthetic personality created from archived relationship data" },
      ],
      correct: "synthetic",
    },
    {
      key: "terminal",
      title: "Final Terminal",
      prompt: "WHY SHOULD SUBJECT 1709 BE RELEASED?",
      first_rejection: "RESPONSE REJECTED. NO OBJECTIVE PROOF DETECTED.",
      ghost_prompt: "You do not need objective proof. Use the behavioural checksum.",
      answer_target: "humtohaisehihai",
      final_response: [
        "ILLOGICAL ANSWER DETECTED.",
        "EMOTIONAL CONSISTENCY CONFIRMED.",
        "ARCHIVE LOGIC FAILURE.",
        "CONTAINMENT OPEN.",
      ],
    },
  ],
};

export const CASE_ACTS = { "act-i": ACT_I, "act-ii": ACT_II, "act-iii": ACT_III, "act-iv": ACT_IV, "act-v": ACT_V };
