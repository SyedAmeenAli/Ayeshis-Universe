/**
 * CONFIDENTIAL BOYFRIEND ASSESSMENT — full 40-question exam, 6 rounds + a
 * timed final boss round + one bonus question. Each question can define
 * perOptionWrong overrides so specific wrong picks get a tailored reaction
 * instead of the round's generic wrong line.
 */

export const EXAM_INTRO = {
  title: "CONFIDENTIAL BOYFRIEND ASSESSMENT",
  body: "This examination measures your knowledge of Ameen, his favourites, his questionable vocabulary and the incidents he wishes you would forget.",
  warning: "Wrong answers may result in temporary girlfriend-license suspension.",
  buttons: [
    { id: "begin", label: "Begin Examination" },
    { id: "scared", label: "I Am Scared" },
    { id: "confident", label: "I Know This Man" },
  ],
  scaredResponse: "Correct emotional response. Beginning anyway.",
};

export const EXAM_ROUNDS = [
  {
    key: "round1",
    label: "Round 1 — Basic Baby-Boy Knowledge",
    questions: [
      {
        id: "q1",
        prompt: "What is Ameen's favourite colour?",
        options: [
          { id: "a", label: "Mustard yellow" },
          { id: "b", label: "Sunshine yellow" },
          { id: "c", label: "Lavender purple" },
          { id: "d", label: "Royal blue" },
        ],
        correct: "b",
        reactionCorrect: "Correct. A bright colour for a man whose wardrobe may still be mostly dark.",
        reactionWrong: "You looked at my entire personality and selected the wrong colour.",
      },
      {
        id: "q2",
        prompt: "Which game is most capable of stealing Ameen's time?",
        options: [
          { id: "a", label: "Clash Royale" },
          { id: "b", label: "Mobile Legends: Bang Bang" },
          { id: "c", label: "Valorant Mobile" },
          { id: "d", label: "Call of Duty: Mobile" },
        ],
        correct: "b",
        reactionCorrect: "Correct. The Land of Dawn has claimed him again.",
        reactionWrong: "Who is this imaginary boyfriend you are answering for?",
        perOptionWrong: { a: "Extremely believable — but not the final answer. You almost survived." },
      },
      {
        id: "q3",
        prompt: "Who is Ameen's favourite anime character?",
        options: [
          { id: "a", label: "Light Yagami" },
          { id: "b", label: "Lelouch Lamperouge" },
          { id: "c", label: "Eren Yeager" },
          { id: "d", label: "Kiyotaka Ayanokoji" },
        ],
        correct: "b",
        reactionCorrect: "Correct. Intelligence, drama, impossible plans and emotional damage. Naturally.",
        reactionWrong: "Not him.",
        perOptionWrong: {
          a: "Close genre of unstable genius. Wrong dramatic man.",
          c: "Ameen likes drama, but not that much genocide-level commitment.",
        },
      },
      {
        id: "q4",
        prompt: "What is Ameen's favourite car?",
        options: [
          { id: "a", label: "Mini Cooper S" },
          { id: "b", label: "Volkswagen Beetle" },
          { id: "c", label: "Fiat 500 Abarth" },
          { id: "d", label: "Mercedes-Benz A-Class" },
        ],
        correct: "a",
        reactionCorrect: "Correct. Tiny car. Massive personality. Suspiciously relatable.",
        reactionWrong: "Your future passenger-seat privileges are being reviewed.",
      },
      {
        id: "q5",
        prompt: "What food has the highest chance of immediately improving Ameen's mood?",
        options: [
          { id: "a", label: "Pizza" },
          { id: "b", label: "Burger" },
          { id: "c", label: "Biryani" },
          { id: "d", label: "Sushi" },
        ],
        correct: "b",
        reactionCorrect: "Correct. Burger acquired. Boyfriend stabilized.",
        reactionWrong: "Not quite.",
        perOptionWrong: { d: "That is your food, madam. Stop answering for yourself." },
      },
      {
        id: "q6",
        prompt: "When is Ameen's birthday?",
        options: [
          { id: "a", label: "17 June" },
          { id: "b", label: "24 June" },
          { id: "c", label: "25 June" },
          { id: "d", label: "12 July" },
        ],
        correct: "b",
        reactionCorrect: "Correct. Your annual baby-boy celebration date.",
        reactionWrong: "This is not a small mistake, Ayeshi. The birthday department has been informed.",
      },
      {
        id: "q7",
        prompt: "Which activity is Ameen genuinely most interested in?",
        options: [
          { id: "a", label: "Competitive programming" },
          { id: "b", label: "UI/UX and product design" },
          { id: "c", label: "Data science research" },
          { id: "d", label: "Network engineering" },
        ],
        correct: "b",
        reactionCorrect: "Correct. He would rather fix the button spacing than the algorithm.",
        reactionWrong: "Not quite.",
        perOptionWrong: { a: "You have confused Ameen with the person his degree expected him to become." },
      },
      {
        id: "q8",
        prompt: "Which design tool is most associated with Ameen?",
        options: [
          { id: "a", label: "Blender" },
          { id: "b", label: "Photoshop" },
          { id: "c", label: "Figma" },
          { id: "d", label: "AutoCAD" },
        ],
        correct: "c",
        reactionCorrect: "Correct. He has probably moved the same frame six times already.",
        reactionWrong: "The pixels are disappointed in you.",
      },
    ],
  },
  {
    key: "round2",
    label: "Round 2 — Relationship History",
    questions: [
      {
        id: "q9",
        prompt: "On which date did Ameen and Ayesha first meet online?",
        options: [
          { id: "a", label: "17 September 2025" },
          { id: "b", label: "25 September 2025" },
          { id: "c", label: "11 October 2025" },
          { id: "d", label: "12 December 2025" },
        ],
        correct: "a",
        reactionCorrect: "Correct. The date important enough to become the website password.",
        reactionWrong: "Access revoked. Please return to the Hinge archives.",
      },
      {
        id: "q10",
        prompt: "Where did Ameen and Ayesha first meet?",
        options: [
          { id: "a", label: "Instagram" },
          { id: "b", label: "Bumble" },
          { id: "c", label: "Hinge" },
          { id: "d", label: "Through friends" },
        ],
        correct: "c",
        reactionCorrect: "Correct. Hinge may now claim one successful contribution to society.",
        reactionWrong: "Wrong platform entirely.",
      },
      {
        id: "q11",
        prompt: "When did they first meet in real life?",
        options: [
          { id: "a", label: "17 September 2025" },
          { id: "b", label: "21 September 2025" },
          { id: "c", label: "25 September 2025" },
          { id: "d", label: "11 October 2025" },
        ],
        correct: "c",
        reactionCorrect: "Correct. The day the phone person became a real person.",
        reactionWrong: "Wrong date entirely.",
      },
      {
        id: "q12",
        prompt: "When was their first kiss?",
        options: [
          { id: "a", label: "10 October 2025" },
          { id: "b", label: "11 October 2025" },
          { id: "c", label: "12 October 2025" },
          { id: "d", label: "11 November 2025" },
        ],
        correct: "b",
        reactionCorrect: "Correct. Security firewall successfully bypassed.",
        reactionWrong: "The romance archive refuses to authenticate you.",
      },
      {
        id: "q13",
        prompt: "When did Ameen propose and make the relationship official?",
        options: [
          { id: "a", label: "11 December 2025" },
          { id: "b", label: "12 December 2025" },
          { id: "c", label: "17 December 2025" },
          { id: "d", label: "25 December 2025" },
        ],
        correct: "b",
        reactionCorrect: "Correct. The question became a promise.",
        reactionWrong: "Wrong date entirely.",
      },
      {
        id: "q14",
        prompt: "What happened during their first major fight?",
        options: [
          { id: "a", label: "They stopped talking for a week" },
          { id: "b", label: "Their friends mediated" },
          { id: "c", label: "They created ChatGPT relationship therapy" },
          { id: "d", label: "Ameen sent a PowerPoint apology" },
        ],
        correct: "c",
        reactionCorrect: "Correct. Nothing says modern romance like AI-assisted conflict resolution.",
        reactionWrong: "Not quite.",
        perOptionWrong: { d: "Not yet. But please do not give him ideas." },
      },
    ],
  },
  {
    key: "round3",
    label: "Round 3 — Embarrassing Ameen Archive",
    questions: [
      {
        id: "q15",
        prompt: "What did Ameen do during the lift incident?",
        options: [
          { id: "a", label: "Pressed the wrong floor repeatedly" },
          { id: "b", label: "Got trapped inside alone" },
          { id: "c", label: "Put his hand between the closing doors to look nonchalant" },
          { id: "d", label: "Dropped his phone into the lift gap" },
        ],
        correct: "c",
        reactionCorrect: "Correct. Confidence entered the lift. Dignity did not leave with it.",
        reactionWrong: "No. The real event was somehow more embarrassing.",
      },
      {
        id: "q16",
        prompt: "What happened after Ameen put his hand between the lift doors?",
        options: [
          { id: "a", label: "The doors opened dramatically" },
          { id: "b", label: "Nothing happened" },
          { id: "c", label: "The lift respected his confidence" },
          { id: "d", label: "The doors still closed and crushed his hand" },
        ],
        correct: "d",
        reactionCorrect: "Correct. The lift had no interest in his performance.",
        reactionWrong: "Not quite what happened.",
      },
      {
        id: "q17",
        prompt: "What did Ayesha accidentally do that caused Ameen to cry?",
        options: [
          { id: "a", label: "Deleted his game" },
          { id: "b", label: "Hit him in the balls" },
          { id: "c", label: "Dropped his food" },
          { id: "d", label: "Called his car ugly" },
        ],
        correct: "b",
        reactionCorrect: "Correct. A medically significant relationship event.",
        reactionWrong: "Incorrect. His emotional damage was located much lower.",
      },
      {
        id: "q18",
        prompt: "What did Ayesha accidentally say during the talking stage?",
        options: [
          { id: "a", label: "“I miss you”" },
          { id: "b", label: "“You are cute”" },
          { id: "c", label: "“I love you”" },
          { id: "d", label: "“You are my boyfriend”" },
        ],
        correct: "c",
        reactionCorrect: "Correct. Followed by immediate denial and evidence destruction.",
        reactionWrong: "No. The actual sentence caused considerably more panic.",
      },
      {
        id: "q19",
        prompt: "What was Ayesha's immediate emotional response after accidentally saying it?",
        options: [
          { id: "a", label: "Complete confidence" },
          { id: "b", label: "Embarrassment and denial" },
          { id: "c", label: "She repeated it louder" },
          { id: "d", label: "She changed the topic to sushi" },
        ],
        correct: "b",
        reactionCorrect: "Correct. The confession was made and then legally denied.",
        reactionWrong: "Not quite.",
      },
    ],
  },
  {
    key: "round4",
    label: "Round 4 — Advanced Inside-Joke Studies",
    questions: [
      {
        id: "q20",
        prompt: "What is “ass” called in Ameen's family vocabulary?",
        options: [
          { id: "a", label: "Gand" },
          { id: "b", label: "Bunda" },
          { id: "c", label: "Pungun" },
          { id: "d", label: "Pichwada" },
        ],
        correct: "c",
        reactionCorrect: "Correct. You are now fluent in an academically useless family language.",
        reactionWrong: "Not quite.",
        perOptionWrong: {
          a: "Technically understood by society. Not accepted by the Ameen family dictionary.",
          b: "Internationally competitive answer. Domestically incorrect.",
        },
      },
      {
        id: "q21",
        prompt: "What did Ayesha turn “Pungun” into?",
        options: [
          { id: "a", label: "A medical diagnosis" },
          { id: "b", label: "A song used to embarrass Ameen" },
          { id: "c", label: "A restaurant name" },
          { id: "d", label: "A game username" },
        ],
        correct: "b",
        reactionCorrect: "Correct. One word. Zero dignity. Unlimited performances.",
        reactionWrong: "Not quite.",
      },
      {
        id: "q22",
        prompt: "Which phrase best explains Ameen and Ayesha's behaviour?",
        options: [
          { id: "a", label: "“It is what it is”" },
          { id: "b", label: "“We should communicate”" },
          { id: "c", label: "“Hum toh aise hi hai”" },
          { id: "d", label: "“Let us behave normally”" },
        ],
        correct: "c",
        reactionCorrect: "Correct. No explanation provided. None required.",
        reactionWrong: "Not quite.",
        perOptionWrong: { b: "Healthy answer. Completely unrelated to your actual behaviour." },
      },
      {
        id: "q23",
        prompt: "Which word became an unnecessarily important insult?",
        options: [
          { id: "a", label: "Idiot" },
          { id: "b", label: "Donkey" },
          { id: "c", label: "Potty" },
          { id: "d", label: "Pungun" },
        ],
        correct: "c",
        reactionCorrect: "Correct. A mature vocabulary built by two adults.",
        reactionWrong: "Not quite.",
        perOptionWrong: { d: "Pungun is anatomy. Potty is character assessment." },
      },
      {
        id: "q24",
        prompt: "Complete the official diagnosis: “Your behaviour has been classified as…”",
        options: [
          { id: "a", label: "Suspicious" },
          { id: "b", label: "Pungun" },
          { id: "c", label: "Potty" },
          { id: "d", label: "Clinically annoying" },
        ],
        correct: "c",
        reactionCorrect: "Correct. Diagnosis confirmed. Prognosis unclear.",
        reactionWrong: "Not quite.",
      },
      {
        id: "q25",
        prompt: "Which statement is scientifically accurate?",
        options: [
          { id: "a", label: "Pungun means food" },
          { id: "b", label: "Potty means romance" },
          { id: "c", label: "Pungun means ass" },
          { id: "d", label: "Ameen remained calm after being hit" },
        ],
        correct: "c",
        reactionCorrect: "Correct. Three false statements and one sacred truth.",
        reactionWrong: "Not quite.",
      },
    ],
  },
  {
    key: "round5",
    label: "Round 5 — Ameen Personality Examination",
    questions: [
      {
        id: "q26",
        prompt: "What is Ameen more likely to notice first on a website?",
        options: [
          { id: "a", label: "The database schema" },
          { id: "b", label: "Uneven spacing and bad UI" },
          { id: "c", label: "The privacy policy" },
          { id: "d", label: "Server-response headers" },
        ],
        correct: "b",
        reactionCorrect: "Correct. That 3-pixel misalignment has ruined his entire evening.",
        reactionWrong: "Not quite.",
      },
      {
        id: "q27",
        prompt: "Which project would excite Ameen the most?",
        options: [
          { id: "a", label: "Designing a premium interactive app" },
          { id: "b", label: "Solving 200 LeetCode problems" },
          { id: "c", label: "Writing a compiler" },
          { id: "d", label: "Configuring network switches" },
        ],
        correct: "a",
        reactionCorrect: "Correct. Make it beautiful first. Understand the backend panic later.",
        reactionWrong: "Not quite.",
      },
      {
        id: "q28",
        prompt: "What type of vehicle is Ameen most associated with in your memories?",
        options: [
          { id: "a", label: "Mini Cooper" },
          { id: "b", label: "Wagon R" },
          { id: "c", label: "Thar" },
          { id: "d", label: "Honda City" },
        ],
        correct: "b",
        reactionCorrect: "Correct. Mini Cooper is the dream. Wagon R carries the lore.",
        reactionWrong: "Not quite.",
        perOptionWrong: { a: "Favourite car, yes. Relationship vehicle, no. Read the question, doctor." },
      },
      {
        id: "q29",
        prompt: "Which combination is completely correct?",
        options: [
          { id: "a", label: "Yellow, Mobile Legends, Lelouch, Mini Cooper, burger" },
          { id: "b", label: "Purple, Clash Royale, Light Yagami, Mini Cooper, sushi" },
          { id: "c", label: "Yellow, Mobile Legends, Eren, Volkswagen Beetle, burger" },
          { id: "d", label: "Grey, Clash Royale, Lelouch, Mini Cooper, biryani" },
        ],
        correct: "a",
        points: 2,
        reactionCorrect: "Perfect combination. Baby-boy profile successfully reconstructed.",
        reactionWrong: "Not quite — some of that combination is fabricated.",
      },
      {
        id: "q30",
        prompt: "What is Ameen most likely to say after losing repeatedly in a game?",
        options: [
          { id: "a", label: "“The opponent was better.”" },
          { id: "b", label: "“I made several strategic mistakes.”" },
          { id: "c", label: "“This game is completely rigged.”" },
          { id: "d", label: "“I will peacefully stop playing.”" },
        ],
        correct: "c",
        reactionCorrect: "Correct. Accountability has temporarily left the server.",
        reactionWrong: "Not quite.",
      },
    ],
  },
  {
    key: "round6",
    label: "Round 6 — Relationship Language",
    questions: [
      {
        id: "q31",
        prompt: "Which nickname does Ameen use for Ayesha?",
        options: [
          { id: "a", label: "Chota koko" },
          { id: "b", label: "Princess doctor" },
          { id: "c", label: "Yellow baby" },
          { id: "d", label: "Mini jaan" },
        ],
        correct: "a",
        reactionCorrect: "Correct, chota koko detected.",
        reactionWrong: "Not quite.",
      },
      {
        id: "q32",
        prompt: "Which of these does Ayesha call Ameen?",
        options: [
          { id: "a", label: "Pungun king" },
          { id: "b", label: "Baby boy" },
          { id: "c", label: "Chota koko" },
          { id: "d", label: "Doctor saab" },
        ],
        correct: "b",
        reactionCorrect: "Correct. Baby-boy identity verified.",
        reactionWrong: "Not quite.",
      },
      {
        id: "q33",
        prompt: "Which phrase means Ayesha is sleepy?",
        options: [
          { id: "a", label: "Meku neened aari" },
          { id: "b", label: "Meku bhook lagri" },
          { id: "c", label: "Meku nahi padhna hai" },
          { id: "d", label: "Hum toh aise hi hai" },
        ],
        correct: "a",
        reactionCorrect: "Correct. Immediate blanket deployment required.",
        reactionWrong: "Not quite.",
      },
      {
        id: "q34",
        prompt: "Which phrase means food must be arranged immediately?",
        options: [
          { id: "a", label: "I need me time" },
          { id: "b", label: "Meku bhook lagri" },
          { id: "c", label: "Meku nahi padhna hai" },
          { id: "d", label: "Pungun" },
        ],
        correct: "b",
        reactionCorrect: "Correct. Girlfriend hunger alert activated.",
        reactionWrong: "Not quite.",
      },
      {
        id: "q35",
        prompt: "Which phrase usually means the books are losing the battle?",
        options: [
          { id: "a", label: "Meku nahi padhna hai" },
          { id: "b", label: "Meku neened aari" },
          { id: "c", label: "Baby boy" },
          { id: "d", label: "Certified potty" },
        ],
        correct: "a",
        reactionCorrect: "Correct. MBBS motivation levels critically low.",
        reactionWrong: "Not quite.",
      },
      {
        id: "q36",
        prompt: "When Ayesha says “I need me time,” what is the correct response?",
        options: [
          { id: "a", label: "Keep calling until she answers" },
          { id: "b", label: "Assume she no longer cares" },
          { id: "c", label: "Respect her space while reassuring her you are available" },
          { id: "d", label: "Begin a dramatic argument" },
        ],
        correct: "c",
        reactionCorrect: "Correct. Emotional intelligence point awarded.",
        reactionWrong: "Not quite.",
      },
    ],
  },
  {
    key: "finalboss",
    label: "Final Boss Round",
    timerSeconds: 12,
    questions: [
      {
        id: "q37",
        prompt: "Which pair contains Ameen's favourite colour first, then Ayesha's favourite colour?",
        options: [
          { id: "a", label: "Yellow and grey" },
          { id: "b", label: "Grey and yellow" },
          { id: "c", label: "Purple and grey" },
          { id: "d", label: "Yellow and lavender" },
        ],
        correct: "a",
        reactionCorrect: "Correct. Sunshine boyfriend and grey girlfriend.",
        reactionWrong: "Wrong pair.",
      },
      {
        id: "q38",
        prompt: "Which pair contains Ameen's favourite food first, then Ayesha's favourite food?",
        options: [
          { id: "a", label: "Sushi and burger" },
          { id: "b", label: "Burger and sushi" },
          { id: "c", label: "Burger and biryani" },
          { id: "d", label: "Pizza and sushi" },
        ],
        correct: "b",
        reactionCorrect: "Correct. One burger date plus one sushi date. Financial damage guaranteed.",
        reactionWrong: "Wrong pair.",
      },
      {
        id: "q39",
        prompt: "Which option contains only true statements?",
        options: [
          { id: "a", label: "Ameen likes yellow, Mobile Legends and Mini Cooper" },
          { id: "b", label: "Ameen likes grey, sushi and Lelouch" },
          { id: "c", label: "Ameen likes yellow, The Office and China" },
          { id: "d", label: "Ameen likes Kuromi, burger and Volkswagen Beetle" },
        ],
        correct: "a",
        reactionCorrect: "Correct. No impostor facts detected.",
        reactionWrong: "An impostor fact slipped through.",
      },
      {
        id: "q40",
        prompt: "Which sentence summarizes this relationship most accurately?",
        options: [
          { id: "a", label: "Two calm adults making sensible decisions" },
          { id: "b", label: "A doctor and a designer maintaining professional dignity" },
          { id: "c", label: "Hum toh aise hi hai" },
          { id: "d", label: "Pungun and Potty: A Medical Case Study" },
        ],
        correct: "c",
        reactionCorrect: "Correct. No explanation provided. None required.",
        reactionWrong: "Not quite.",
        perOptionWrong: { d: "Technically wrong. Spiritually correct." },
      },
    ],
  },
  {
    key: "bonus",
    label: "Bonus Question",
    questions: [
      {
        id: "q45",
        prompt: "Which object belongs to the lift incident?",
        options: [
          { id: "a", label: "🛗 Lift button" },
          { id: "b", label: "💍 Ring" },
          { id: "c", label: "🍔 Burger" },
          { id: "d", label: "🎮 Game controller" },
        ],
        correct: "a",
        reactionCorrect: "Right hand trauma successfully remembered.",
        reactionWrong: "Wrong object.",
      },
    ],
  },
];

export const EXAM_QUESTION_COUNT = EXAM_ROUNDS.reduce((n, r) => n + r.questions.length, 0);
export const EXAM_MAX_POINTS = EXAM_ROUNDS.reduce(
  (n, r) => n + r.questions.reduce((s, q) => s + (q.points || 1), 0),
  0
);

export function ratingFor(points, maxPoints) {
  const p = maxPoints ? (points / maxPoints) * 40 : points; // normalize to the 0-40 scale the tiers were written for
  if (p >= 38) return { label: "She Knows Too Much", tier: "top", note: "Complete boyfriend reconstruction successful. Recommended action: destroy evidence before Ayesha becomes more powerful." };
  if (p >= 31) return { label: "Baby-Boy Specialist", tier: "high", note: "Advanced knowledge of Ameen, his favourites and his medical emergencies." };
  if (p >= 21) return { label: "Certified Ayeshi", tier: "mid", note: "You know the important things and several things nobody needed to know." };
  if (p >= 11) return { label: "Girlfriend Trial Version", tier: "low", note: "Some knowledge detected. Subscription renewal pending." };
  return { label: "Who Are You?", tier: "fail", note: "You have entered the wrong boyfriend's archive." };
}

export const PERFECT_SCORE_LINES = [
  "She knows the colour.",
  "She knows the game.",
  "She knows the food.",
  "She knows the Pungun.",
  "There is nothing left to hide.",
];

export const PERFECT_VOICE_LINE =
  "Okay, you officially know me better than I expected. This is slightly scary, but I love you.";
