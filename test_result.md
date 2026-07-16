#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build "AYESHA'S PRIVATE UNIVERSE" — a private, cinematic, full-stack anniversary web app.
  Phase 1 vertical slice: Boot → Gateway (17 Sep 2025) → Home dashboard → /our-story (16 sections)
  → /why-i-love-you → /memories (with Sept 17 memory long-press bow) → /ten-months (locked final reveal).
  Full hidden-scroll unlock journey must persist across refresh.

backend:
  - task: "Gateway auth — normalised date accept, HttpOnly session cookie, rate limiting"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          POST /api/auth/gateway accepts all six spec formats (17 September 2025, 17th September 2025,
          17/09/2025, 17-09-2025, 17092025, 2025-09-17). Wrong answers return ok:false without leaking.
          Correct answers set apu_session HttpOnly cookie, GET /api/auth/me confirms session.
          Rate limit 12 attempts per 15 min per IP. Curl-verified end to end.

  - task: "Progress tracking — sections explored, hidden-scroll eligibility, unlock, view state"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          GET /api/progress returns full state. POST /api/progress/section adds section keys
          (with 8 tracked). hidden_scroll_eligible flips to true at 4+ sections.
          POST /api/progress/hidden-scroll requires eligibility else 403 — unlocks final reveal.
          POST /api/progress/final-viewed marks viewed; enforced via cookie session.

  - task: "Memories seed + read + favourite"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          On startup, seeds 8 memories including sep-17-the-match (hidden_bow=true).
          GET /api/memories returns array. GET /api/memories/{slug} returns detail.
          POST /api/memories/{slug}/favourite toggles per-profile favourite state.

  - task: "Story reading position persistence"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "POST /api/progress/story-position persists {section_index, scroll_ratio}."

frontend:
  - task: "Boot screen with rotating messages, progress bar, skip button, auto-navigate"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/Boot.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Skull-and-bow mascot visible with lavender glow. Six rotating messages. Skip button
          appears after 1.5s. Auto-navigates to /gateway (guest) or /home (authed) after ~4.6s.
          Confirmed visually.

  - task: "Password Gateway — glass panel, floating tulips, rotating wrong-answer copy"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/Gateway.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Dark glass panel with editorial "This world belongs to one person." typography.
          Floating grey tulips animated. Wrong answers show rotating copy variants.
          Successful unlock plays "Identity confirmed. Welcome home, Ayeshi." then routes to /home.

  - task: "Home dashboard — asymmetric bento, greeting, day counter, rotating lines, ink clue"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/Home.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Time-of-day greeting, day counter based on 17 Sep 2025, progress ring, rotating
          intimate lines. 10 bento cards + LockedFinalCard. Hidden ink clue appears at bottom-right
          once hiddenScrollEligible flips true. LockedFinal transforms to open-link when unlocked.

  - task: "Our Story — 16 cinematic sections with per-section animation kinds"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/OurStory.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          All 16 sections rendered with distinct kinds (split, hinge, phone, lift, confession,
          kiss, cards, align, ring, birthday, editorial-strip, strip, monolith, portal, locked).
          Lenis smooth scroll active. Intersection observer saves reading position to backend.
          Fixed month indicator on left. Portal section links to all destinations.

  - task: "Why I Love You — 9 chapter romantic editorial with orbit chapter"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/WhyILoveYou.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Mode-romantic ivory surface (inverted local theme). 9 chapters + opening + closing.
          Chapter 03 (small versions) is an interactive orbit with 10 selectable versions.
          Chapter 06 uses horizontal strip. Handwritten annotations, MaskReveal + FadeUp motion.

  - task: "Memory Vault — search, category filter, favourites filter, timeline rail"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/Memories.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Loads 8 seeded memories. Search across title/caption/tags. Filter by category
          (all/our_firsts/months/photos/things_only_we_understand) and favourites-only. Cards
          animate in with stagger. Timeline rail on desktop with anchor navigation.

  - task: "Memory Detail with hidden long-press bow (3 seconds)"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/MemoryDetail.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          For sep-17-the-match, tiny bow bottom-right of image. Long-press 3s draws circular
          progress ring. Before eligibility (< 4 sections explored), tooltip says explore more.
          On unlock, shows "You found what was never meant to be obvious" and CTA to /ten-months.
          Long-press works on both mouse and touch. Favourite toggle persists.

  - task: "Ten Months final reveal — 9 scenes, gated by unlock, marks viewed"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/TenMonths.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Redirects to /home if !finalRevealUnlocked. On mount marks viewed. Scenes: 1) hand
          "There was never a final case", 2) 10 clickable month lights with modal, 3) big title,
          4) sticky letter with 30+ lines, 5) voice letter placeholder, 6) video placeholder,
          7) 10-frame montage strip, 8) animated Hyderabad→China map, 9) continue CTA.

  - task: "App shell — nav, mobile dock, custom cursor, film grain, protected route"
    implemented: true
    working: true
    file: "/app/frontend/src/components/shell/AppShell.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Floating top-rail nav (desktop). Bottom dock with 4 primary + More sheet (mobile).
          Custom cursor with 8-particle lavender trail; disabled on touch and reduced-motion.
          Film grain overlay via SVG data URI. ProtectedRoute redirects to /gateway on 401.
          useSectionTracker automatically tracks eligible sections when routes mount.

  - task: "Reduced-motion respected across scroll effects, cursor and animations"
    implemented: true
    working: true
    file: "/app/frontend/src/hooks/useReducedMotion.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: |
          Lenis initialization is skipped when reduced-motion is preferred/toggled. Custom
          cursor disabled. Global CSS caps all animation/transition duration to 0.01ms via
          prefers-reduced-motion media query.

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: true

test_plan:
  current_focus:
    - "Gateway auth — normalised date accept, HttpOnly session cookie, rate limiting"
    - "Progress tracking — sections explored, hidden-scroll eligibility, unlock, view state"
    - "Memories seed + read + favourite"
    - "Boot screen with rotating messages, progress bar, skip button, auto-navigate"
    - "Password Gateway — glass panel, floating tulips, rotating wrong-answer copy"
    - "Home dashboard — asymmetric bento, greeting, day counter, rotating lines, ink clue"
    - "Our Story — 16 cinematic sections with per-section animation kinds"
    - "Why I Love You — 9 chapter romantic editorial with orbit chapter"
    - "Memory Vault — search, category filter, favourites filter, timeline rail"
    - "Memory Detail with hidden long-press bow (3 seconds)"
    - "Ten Months final reveal — 9 scenes, gated by unlock, marks viewed"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Phase 1 vertical slice implemented and manually curl-verified. All routes protected via
      HttpOnly session cookie apu_session. Please run the full end-to-end test covering:
      1. Gateway auth: wrong answer → rotating error; each of the six accepted date formats → success
      2. Refresh persistence: after login, close & reopen — should stay authed via cookie
      3. Explore 4+ eligible sections → hidden_scroll_eligible flips true (verify /api/progress)
      4. /memories/sep-17-the-match → long-press bow for 3s → hidden scroll appears
      5. /ten-months blocked before unlock (redirects home). After unlock, loads all 9 scenes.
      6. Refresh /ten-months after unlock — should remain accessible.
      7. Story reading position: scroll to a mid section, refresh /our-story — should restore.

      Credentials: /app/memory/test_credentials.md. No username needed — just the date.
