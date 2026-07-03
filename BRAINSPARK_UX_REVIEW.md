# BrainSpark — UX Review Brief

## What It Is
BrainSpark is a mobile app (Android) for parents of children aged 3–12. The parent sets up the app, selects the child's age group, and the child plays cognitive training games. A Parent Dashboard shows progress over time. The app is currently free, no login required.

---

## Primary User
**Parent** — sets up, monitors progress via dashboard.  
**Child** — plays the games (on the parent's phone).

---

## App Structure

3 tabs at the bottom:

| Tab | Purpose |
|-----|---------|
| 🏠 Home | Onboarding + age selection + feature overview |
| 🎮 Games | Game library — pick and play |
| 📊 Dashboard | Parent's view of progress, scores, streaks |

Plus 2 stack screens pushed on top:
- **Assessment** — a 5-domain cognitive quiz (launched from Home or Games tab)
- **Game** — full-screen game session (launched from Games tab)

---

## Screen 1: Home

**First thing the user sees.** No login, no signup.

**Layout (scrollable):**
1. **Hero** — Brain emoji, headline "Build Smarter Brains Through Play", 2-line subtext about being free and AI-adaptive
2. **Age selection** — 3 cards side by side:
   - 🧒 3–5 · "Little Explorers"
   - 🧑‍🎓 6–8 · "Rising Stars"
   - 🧑‍💻 9–12 · "Brain Champions"
   - Tapping one selects it (highlighted border)
3. **Two CTA buttons** (enabled only after age is selected):
   - Primary: "Start Brain Assessment" → goes to Assessment screen
   - Secondary: "Skip to Games" → goes to Games tab
4. **5 Cognitive Domains** — horizontal chip row: 🧩 Memory · 👁️ Attention · 🔍 Patterns · 🗺️ Spatial · ⚙️ Logic
5. **Why BrainSpark?** — 6 feature cards (2-column grid):
   - 🧠 Cognitive Assessment (tappable → Assessment)
   - 🎮 5 Brain Games (tappable → Games)
   - 📈 Adaptive Difficulty (tappable → Games)
   - 👨‍👩‍👧 Parent Dashboard (tappable → Dashboard)
   - 🌐 Regional Languages (COMING SOON — not tappable, dimmed)
   - 🤖 AI Voice Tutor (COMING SOON — not tappable, dimmed)
6. **How It Works** — 3 numbered steps: Take Assessment → Play Daily → Track Growth
7. **CTA Banner** — "Ready to spark your child's brain?" with tagline "100% free. No ads. No data selling."

**Key behaviours:**
- Age selection is required before either CTA button activates
- No navigation away from Home is required — the user can go directly to Games without doing anything

---

## Screen 2: Games

**Layout (scrollable):**
1. **Header** — "Brain Games" title + streak badge (🔥 N day streak) + games played count
2. **Assessment prompt banner** *(shown only if no assessment taken yet)* — nudges user to take the 5-minute assessment for adaptive difficulty. Has a "Start Assessment" button.
3. **Game cards grid** (2 columns, all always accessible):
   - 🧩 Memory Match — flip pairs, train working memory
   - 👁️ Spot the Odd — find the different item in a grid
   - 🔍 Pattern Puzzle — complete repeating sequences
   - 🗺️ Shape Shift — find rotated/mirrored shapes
   - ⚙️ Number Logic — crack number sequences
   - Each card shows: icon, name, domain tag (MEMORY / ATTENTION etc.), description, and "Played Nx · Best: Y" or a NEW badge
4. **Daily Challenge card** — "Play at least one game every day". Shows a "Play a Random Game" button if not yet played today, or a ✓ done message if already played.

**Key behaviours:**
- All 5 games are always unlocked — no paywall yet
- Difficulty auto-adapts based on age group and win rate (easy/medium/hard internally)
- No login needed — progress tied to device ID

---

## Screen 3: Assessment (full-screen, replaces tab bar)

5-domain cognitive quiz. Each domain has 2–3 timed rounds depending on difficulty.

**Domains in order:** Memory → Attention → Pattern → Spatial → Logic

**Per domain, the flow is:**
1. **Intro card** — domain name, icon, brief instruction ("Remember the sequence!")
2. **Challenge rounds** — timed (10–20 seconds each), child interacts
3. After all domains: **Result screen** showing scores per domain (0–100%) and two buttons:
   - "View Dashboard" → Parent Dashboard
   - "Play Games" → Games tab

**Game types inside assessment:**
- **Memory** — show a sequence of emojis, hide it, pick the correct sequence from 4 options
- **Attention** — tap the odd emoji in a grid
- **Pattern** — pick what comes next in a repeating emoji sequence
- **Spatial** — pick the correct rotation/mirror of a shape grid
- **Logic** — count objects or complete a number sequence

---

## Screen 4: Game Sessions (full-screen)

Each game follows the same shell:
- **Header bar** — timer (⏱️ Ns), round counter (Round X/Y), score (🎯 N)
- **Game content** — varies per game
- **Progress bar** at bottom — fills as rounds complete
- After all rounds: **Result screen** — star rating (1–3 stars), score, correct/total, time taken, Play Again + Back buttons

**The 5 games:**

| Game | Mechanic |
|------|----------|
| Memory Match | Flip face-down cards, find matching emoji pairs. Cards shown 1 at a time. |
| Spot the Odd | Grid of identical emojis with 1 different one. Tap the odd one out before time runs out. |
| Pattern Puzzle | Sequence of emojis following a repeating rule. Pick what comes next from 3–4 options. |
| Shape Shift | 2D grid with some cells filled. Pick which of 3 options shows the correct 90°/180°/mirror transformation. |
| Number Logic | Either count coloured circles (tap a number) or find the next number in a sequence. |

---

## Screen 5: Parent Dashboard

**Accessible only by parent.** No child-facing content here.

**Layout (scrollable):**
1. **Header** — "📊 Parent Dashboard" + age badge + streak badge
2. **Stats grid** (2×2):
   - Cognitive Score (avg of assessment %)
   - Games Played (total count)
   - Total Points (cumulative score)
   - Best Streak (days)
3. **No-profile prompt** *(if assessment not taken)* — nudges to take assessment
4. **Cognitive Profile card** — pentagon radar chart showing 5 domain scores, plus horizontal progress bars for each domain
5. **Recent Activity card** — chronological list of games played (icon, name, date, best score), plus "Play Now" button
6. **Game Details grid** — per-game breakdown: games played, win rate (colour-coded green/amber/red), best score, win rate progress bar
7. **Reset All Data** button at bottom (destructive, confirmation alert)

---

## User Flows

**Flow A — First-time parent:**
Home → select age → Start Assessment → complete 5 domains → see scores → View Dashboard → see radar chart

**Flow B — Returning child:**
Home (or direct to Games tab) → tap a game → play through rounds → result screen → back to Games

**Flow C — Parent checking progress:**
Dashboard tab → see radar chart, streak, win rates per game

---

## Potential UX Questions for Review

1. The Home screen requires age selection before either CTA activates — is this friction or necessary context?
2. The Assessment and Games are both entry points. Is it confusing that you can skip assessment and go straight to games?
3. The Dashboard is called "Parent Dashboard" but lives in the same tab bar the child uses for games — does this feel mixed up?
4. Game result screens have "Play Again" and "Back" but no "Next Game" — is that a missed opportunity?
5. The Home screen is long (7 sections). Does the hero + age selection + dual CTA give enough reason to scroll further?
6. Difficulty adapts silently (child never sees "Easy/Medium/Hard") — is that the right call for a kids app?
