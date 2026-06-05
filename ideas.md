# Reps — Design Brainstorm

## Context
A focused, single-user exam prep drill app. The user is under time pressure, studying for a 3-hour open-book operations management exam. The aesthetic must reduce cognitive load, surface information with surgical clarity, and make timed drilling feel fast and satisfying.

---

<response>
<text>
## Idea A — "Terminal Precision" (Probability: 0.08)

**Design Movement:** Industrial Brutalism meets Bloomberg Terminal

**Core Principles:**
1. Information density without clutter — every pixel earns its place
2. Monospace data, proportional prose — two-font system with hard contrast
3. Color as signal only — never decoration
4. Mechanical rhythm — grid-locked, no organic curves

**Color Philosophy:**
- Background: Deep charcoal (#0F1117) — not pure black, avoids eye strain
- Surface: Slightly lighter slate (#1A1D27)
- Accent: Electric amber (#F5A623) — Bloomberg-inspired, high-visibility for timers and CTAs
- Success: Muted teal (#2DD4BF)
- Danger/Trap: Crimson (#EF4444)
- Text: Near-white (#E8EAF0), secondary (#8892A4)

**Layout Paradigm:**
- Fixed left sidebar (220px) with icon + label navigation
- Main content area with a strict 12-column grid
- Dashboard: asymmetric 3-column layout — stats left, actions center, queue right
- Drill view: full-width focus mode, sidebar collapses to icon-only

**Signature Elements:**
1. Monospace formula display with amber highlight on key variables
2. Timer as a thin progress bar at the very top of the viewport (global, always visible)
3. Trap chips rendered as red-bordered pill badges with a ⚠ prefix

**Interaction Philosophy:**
- Keyboard-first: number keys for bucket selection, Enter to submit, Space to reveal
- Every action has a keyboard shortcut shown in a subtle `[key]` badge
- No hover tooltips — all affordances are visible

**Animation:**
- Instant transitions for keyboard actions
- 150ms ease-out slide-in for new drill stems
- Timer bar animates smoothly, turns amber at 30s, red at 10s

**Typography System:**
- Display/Headings: `JetBrains Mono` (monospace, technical authority)
- Body/Prose: `IBM Plex Sans` (clean, readable, professional)
- Formula display: `JetBrains Mono` with larger size and amber color
</text>
<probability>0.08</probability>
</response>

<response>
<text>
## Idea B — "Focused Slate" (Probability: 0.06)

**Design Movement:** Apple-level Minimal meets Academic Precision

**Core Principles:**
1. Maximum signal, minimum chrome — the content IS the design
2. Generous white space creates cognitive breathing room
3. One confident accent color does all the heavy lifting
4. Typographic hierarchy replaces decorative elements

**Color Philosophy:**
- Background: Deep cool gray (#111827) — warm enough to not feel cold, dark enough for focus
- Surface: Slightly elevated (#1F2937) — 1-step lighter for cards
- Accent: Vibrant cyan (#06B6D4) — energetic but not aggressive, signals "action"
- Muted text: (#6B7280)
- Trap warnings: Soft amber (#F59E0B) — warning without alarm

**Layout Paradigm:**
- Narrow persistent left rail (64px icons only, expands to 200px on hover)
- Content centered with max-width 860px — forces focused reading
- Dashboard: single-column with clear section breaks using subtle dividers
- Drill view: card-centered, nothing else visible

**Signature Elements:**
1. Step progress indicator as a horizontal pill track at top of learn sheets
2. Formula cards with a subtle left-border accent stripe
3. Accuracy percentage displayed in a large, bold, monospace number

**Interaction Philosophy:**
- Progressive disclosure — show only what's needed for the current step
- Smooth transitions between drill steps (150ms fade + slight upward slide)
- Retrieve-first gate: answer input glows cyan on focus

**Animation:**
- 200ms ease-out for card transitions
- Subtle scale(0.98) → scale(1) on card mount
- Timer: circular progress ring, not a bar

**Typography System:**
- Headings: `Syne` (geometric, distinctive, modern)
- Body: `Inter` (clean, readable) — exception to the no-Inter rule given the academic context
- Numbers/Formulas: `Fira Code` (monospace, precise)
</text>
<probability>0.06</probability>
</response>

<response>
<text>
## Idea C — "Exam War Room" (Probability: 0.07)

**Design Movement:** Military Operations Dashboard — precision, urgency, clarity

**Core Principles:**
1. Everything serves the mission: pass the exam
2. Status is always visible — no hunting for progress
3. Hierarchy by urgency, not alphabetical order
4. Dark, focused, distraction-free

**Color Philosophy:**
- Background: Near-black navy (#0D1117)
- Surface: Dark blue-gray (#161B22)
- Primary accent: Vivid green (#22C55E) — "go", "correct", "proceed"
- Warning: Amber (#EAB308)
- Error/Trap: Red (#EF4444)
- Neutral text: (#C9D1D9)

**Layout Paradigm:**
- Full-width top navigation bar (not sidebar) — horizontal nav for 7 modes
- Dashboard: 2-column asymmetric — left 60% content, right 40% action queue
- Drill view: centered card with maximum focus, nav minimized

**Signature Elements:**
1. "Mission status" header showing today's reps vs target as a progress bar
2. Archetype cards styled like tactical briefing cards — code name, status, accuracy
3. Keyboard shortcut hints always visible in bottom-right corner

**Interaction Philosophy:**
- Speed-optimized: every common action has a 1-key shortcut
- Feedback is immediate and unambiguous — green flash for correct, red for wrong
- No modals — everything happens inline

**Animation:**
- Correct answer: brief green pulse on the card
- Wrong answer: subtle red shake (3px, 200ms)
- New stem: 100ms slide-up from bottom

**Typography System:**
- Headings: `Space Grotesk` (technical, authoritative)
- Body: `DM Sans` (clean, modern)
- Formulas: `Fira Mono` (monospace precision)
</text>
<probability>0.07</probability>
</response>

---

## Selected Direction: **Idea A — "Terminal Precision"**

This direction best matches the PRD's "Bloomberg terminal vibe" reference and the exam-eve urgency. The monospace formula display solves the KaTeX gap elegantly. The keyboard-first interaction model directly addresses the missing shortcut support. The amber accent creates a distinctive, memorable visual identity that no other study app uses.
