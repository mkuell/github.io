# Home + Portfolio UX Improvement Plan (April 26, 2026)

## Executive diagnosis

You are right on both points:

1. **Home hero currently feels less cinematic than it could.**
   The code still supports a looping background video, but the hero’s visual hierarchy and CTA structure do not strongly guide users to key sections or outcomes.
2. **Portfolio cards are visually dense and repetitive.**
   Each card currently has: thumbnail + play button + title overlay + repeated title in caption + repeated generic description + CTA button. That creates duplicate information and clutter.
3. **Mixed aspect ratios are handled technically, but not art-directed.**
   Dynamic ratios help avoid distortion, yet the resulting masonry feels inconsistent because card heights and content weight are uneven.

---

## Issue 1: Home page (hero video + navigation)

## What is happening now

- Hero section includes a background video element with lazy-loaded sources and a clay image poster fallback.
- Video playback depends on viewport visibility and reduced-motion preference.
- Navigation exists in the header, but the hero itself offers only one section CTA (“Get in Touch”) plus a non-action label (“MY STORY // PORTFOLIO”), which may be why visitors feel there is no obvious wayfinding from the first screen.

## Practical improvements (high impact, low engineering risk)

### 1) Keep/reinforce cinematic hero video as default

- Keep the horse reel if it better represents your brand tone.
- Improve perception by:
  - ensuring first meaningful frame appears quickly (consider short, compressed intro segment);
  - using a stronger fallback poster frame from the same reel;
  - adding `autoplay` explicitly to the hero video element for clearer intent.

### 2) Add explicit **hero jump navigation**

Add a small set of inline anchor buttons beneath the main headline, for example:

- `View Portfolio`
- `Read Testimonials`
- `About Michael`
- `Start a Project`

This reduces cognitive load versus relying only on top nav (especially on mobile menu states).

### 3) Clarify primary action hierarchy

Current hero has mixed messaging (“MY STORY // PORTFOLIO” + one CTA). Replace with:

- one primary CTA: `Watch Featured Work`
- one secondary CTA: `Book a Call` or `Start a Project`

This balances discovery and conversion.

### 4) Add a visual cue to scroll

A subtle “Scroll ↓” indicator or animated chevron under the hero text can improve first-scroll behavior.

---

## Issue 2: Portfolio section (overlays + sloppy layout)

## What is happening now

- Cards are component-rich and each repeats similar language (“Experience the ... project in this featured video showcase.”).
- Overlay title inside thumbnail duplicates title below.
- Play button + whole-card CTA can feel redundant.
- Featured card logic creates an asymmetric grid that can look unplanned when source media varies.

## Practical improvements (ranked)

### 1) Simplify card anatomy (big win)

Move to one clear interaction model:

- Thumbnail (with either play icon OR hover affordance, not both heavy overlay + button + repeated label)
- One title line
- Optional one-line metadata (e.g., `Brand Film · Interview · :90`)
- Optional short custom summary only for top 3 pieces

Remove the repeated generic description text on all cards.

### 2) Normalize visual rhythm despite mixed source ratios

Choose one of these systems:

- **Option A (recommended):** enforce fixed thumbnail ratio (e.g., `16:9`) using `object-fit: cover`.
- **Option B:** split by ratio into rows/collections (e.g., “Commercial”, “Documentary”, “Social”).

Option A is best for polish and speed.

### 3) Rework featured treatment

Use one explicit featured module at top:

- large “Featured Project” tile with title, 1–2 sentence rationale, and play action.
- all other items in a uniform grid below.

Avoid mixing “some featured in grid” and “others standard” unless there is a clear editorial rule.

### 4) Reduce overlay density

- Keep gradient overlays minimal.
- Show title either on card body or overlay, not both.
- Keep play affordance consistent across all sources (YouTube/Vimeo).

### 5) Improve content strategy and filtering

Add light filtering or category chips:

- `All`, `Commercial`, `Interview`, `Documentary`, `Campaign`, etc.

Also consider pinning 6–9 strongest pieces and moving remaining projects behind “See More”.

---

## Suggested implementation roadmap

## Phase 1 (1–2 sessions)

- Hero: add 3–4 jump links and tighten CTA hierarchy.
- Portfolio: remove duplicate descriptions and duplicate overlay title.
- Standardize card spacing, heading lengths, and CTA labels.

## Phase 2 (2–4 sessions)

- Introduce one Featured module + uniform secondary grid.
- Normalize thumbnail aspect ratio system.
- Add category chips and “See More” progressive disclosure.

## Phase 3 (after analytics review)

- Measure click-through by section/CTA.
- A/B test two hero headline/value propositions.
- Reorder portfolio by business goal (lead generation vs reel showcase).

---

## UX quality checklist before launch

- First screen communicates who you are + what to do next in <5 seconds.
- At least one CTA visible without opening mobile menu.
- Portfolio cards scan cleanly in a 3-second glance.
- No repeated boilerplate descriptions.
- Interaction pattern is consistent across YouTube and Vimeo items.
- Mobile tap targets and spacing feel intentional.

---

## Notes for your next iteration

If you want, next pass can include:

1. a concrete wireframe proposal for the hero and portfolio,
2. exact copy rewrite for top fold and card labels,
3. a trimmed card component spec (HTML/CSS/JS change list) so implementation is straightforward.
