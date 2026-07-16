# AYESHA'S PRIVATE UNIVERSE — PRD

## Original problem statement (essence)

Build a complete, production-ready, mobile-first private full-stack digital universe made
exclusively for one person named Ayesha, by her boyfriend Ameen. Working name:
"PRIVATE ARCHIVE 1709". Primary line: "Ten months. One private universe."

Four emotional modes coexist:
1. Editorial Ayesha — luxurious, fashion-led, premium
2. Romantic Us — warm, intimate, cinematic, handwritten
3. Playful Chaos — comic, tactile, competitive
4. CASE 1709 — cold, forensic, cinematic

Stack (user-directed adaptation): React + FastAPI + MongoDB (spec asked for Next.js +
Supabase). Framer Motion + GSAP + Lenis + Zustand. HttpOnly cookie session. PWA-ready.

## Architecture

- **Frontend**: CRA (React 19), React Router v7, Framer Motion, Lenis smooth scroll on
  cinematic routes only, Zustand for state (session, progress, settings — persisted),
  Tailwind + shadcn/ui components.
- **Backend**: FastAPI, Motor async MongoDB driver, HMAC-signed session tokens stored
  server-side, in-memory rate limiter (12 attempts / 15 min / IP).
- **Data**: MongoDB collections — `memories` (seeded on startup), `progress`,
  `private_sessions`.

## User personas

- **Ayesha** — the sole intended reader. Every screen is written to her.
- **Ameen** — content owner. Studio interface planned but not built in Phase 1.

## Core requirements (static)

- Gateway password: relationship date, 17 September 2025 — accepted in 6 formats,
  server-side validation only.
- Never expose the correct answer in the client bundle.
- Hidden-scroll unlock system must be earned by exploration (≥4 eligible sections),
  found via 3-second long-press on the September 17 memory bow, and persist across
  reloads and sessions.
- Never insert generic stock couple photography — use polished placeholders with asset
  IDs, dimensions and replacement instructions.
- Respect reduced-motion, mobile safe-areas, and 48px touch targets.

## What's implemented (Phase 1 — completed today)

### Backend
- `/api/auth/gateway` — 6-format date normalisation + rate limit + HttpOnly session cookie
- `/api/auth/me`, `/api/auth/logout`
- `/api/config` (public read-only config)
- `/api/progress` (get + section tracking + hidden-scroll unlock + final-viewed)
- `/api/progress/story-position` — persistent reading position
- `/api/memories`, `/api/memories/{slug}`, `/api/memories/{slug}/favourite`
- Startup seed with 8 memories (Sept 17 flagged with `hidden_bow: true`)

### Frontend
- `/` **Boot** — mascot, rotating messages, progress bar, skip after 1.5s, auto-navigate
- `/gateway` — glass panel, floating tulips, rotating wrong-answer copy
- `/home` — asymmetric bento (10 cards + LockedFinalCard), progress ring, day counter,
  rotating intimate lines, hidden ink clue after eligibility
- `/our-story` — all 16 sections, each with its own animation kind (split, hinge, phone,
  lift, confession, kiss, cards, align, ring, birthday, editorial-strip, strip, monolith,
  portal, locked). Reading position saved to backend
- `/why-i-love-you` — inverted ivory editorial, 9 chapters incl. orbit chapter (10 versions)
- `/memories` — 8 seed memories, search, category filter, favourites filter, timeline rail
- `/memories/:slug` — detail view, favourite toggle, hidden long-press bow (3s) on Sept 17
- `/ten-months` — locked reveal with 9 scenes (hand line, 10 lights, title, letter,
  voice/video placeholders, montage, China map, continue). Redirects if not unlocked.
- App shell: floating top-rail nav, mobile bottom dock + More sheet, custom cursor
  with 8-particle lavender trail, film grain, ProtectedRoute
- Reduced-motion respected across cursor, Lenis, and CSS animations
- All unbuilt routes render polished in-world `Archived` shell (no dead buttons, no
  "coming soon" SaaS placeholder)

## Verification
- 20/20 backend pytest tests pass (see `/app/backend/tests/backend_test.py`)
- End-to-end frontend flow verified through testing subagent:
  Boot → Gateway → Home → explore 4 sections → long-press bow → unlock → /ten-months
  → reload → still accessible

## Prioritised backlog (P0 / P1 / P2)

**P0 — Next up (per user's ordered list)**
1. `/wreck-room` — comic destruction sandbox (canvas, projectiles, hit detection, comic
   bubble engine)
2. `/ayesha` and `/ameen` galleries — luxury editorial vs less-glamorous corner
3. `/our-song` — cinematic music room with custom player + upload slot
4. `/safe-space` — private diary (PIN, mood, autosave, share confirmation)
5. `/calendar` — two-sided booking system
6. Five mini-games: jigsaw, timeline, ameen-quiz, sushi-stack, find-koko
7. `/games/case-1709` — 90-120 min detective game with fake phone OS + 5 acts
8. `/studio` — Ameen's private admin (media, content, calendar, quiz manager)

**P1 — Enhancements around Phase 1**
- Real image uploads through object storage (currently placeholders)
- Studio-editable content blocks for story sections
- PWA icon set and precache manifest
- Global audio controller shared between /our-song and /ten-months
- Reduced-motion "quiet" alternates for cinematic scroll pins

**P2 — Nice to have**
- Analytics (route + game completion) with strict opt-in
- Push notifications for date-booking confirmations
- Export diary as PDF/print

## Next tasks

1. Continue to P0.1 — Wreck Room comic destruction sandbox
2. In parallel, upgrade the audio system so it can be reused in /our-song later
3. Add /studio auth scaffold so it's ready when the admin UI is built
