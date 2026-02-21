# Website UX & Accessibility Review (with focus on Testimonials)

Date: 2026-02-21  
Scope reviewed: `index.html`, `styles.css`, `script.js`

## Executive summary

Your testimonial section already has a strong foundation:
- clear section heading and intro copy,
- scannable cards with thematic highlights,
- disclosure controls (`Read More`) to keep scanning light,
- keyboard-friendly `<button>` controls with `aria-expanded` and `aria-controls`.

The biggest opportunities are:
1. **Improve trust signals** (source context, optional dates, optional project/company references).
2. **Strengthen accessibility semantics** in the expandable content pattern.
3. **Increase discoverability and comparability** (sort/filter by theme, pinned “featured” proof point, and optional logo/context chips).
4. **Reduce visual/cognitive friction** on mobile (small text gets down to `0.85rem`, which can be hard for many users).

---

## Current-state findings (what is working, and where gaps exist)

## 1) Information architecture and clarity

### What works
- The section has a concise intro and thematic labels per testimonial (e.g., “Service-oriented partnership”), helping users skim quickly.
- Short quote excerpts + progressive disclosure is good for balancing scanability and depth.

### Gaps
- There is no way to **filter** testimonials by theme (leadership, coaching, cross-functional production, etc.).
- Testimonials are all visually equivalent; there is no **featured proof** to guide first-time visitors.
- Credibility context is partially present (name + role), but could be enhanced with optional metadata (year, project type, engagement context).

## 2) Interaction UX (expand/collapse pattern)

### What works
- Buttons are semantic controls, not links.
- `aria-expanded` state is updated in JavaScript.
- “Collapse all” is available globally.

### Gaps
- The “Collapse all” control appears even when nothing is open, which creates low-value UI noise.
- Expanded content focus management currently jumps users into the newly opened region. This can be useful but may feel abrupt for some keyboard/screen-reader users.
- Button copy toggles between “Read More” and “Show Less” globally; adding testimonial-specific context (e.g., “Read more from Jonas Bromberg”) would improve screen-reader clarity.

## 3) Visual design and readability

### What works
- Cards have clear grouping and hover/focus-within treatment.
- Text hierarchy (highlight > name > role > quote) is sensible.

### Gaps
- On very small screens, testimonial paragraph text is set to `0.85rem`; this is near/under comfortable reading thresholds for many users.
- Blue-on-light backgrounds for control text is likely fine visually, but should be verified against WCAG contrast in all states (default/hover/focus).
- All cards share identical visual weight; adding one featured card treatment can help direct attention.

## 4) Accessibility semantics

### What works
- Proper section heading and named controls.
- Disclosures are keyboard operable and tied with `aria-controls`.

### Gaps and improvements
- Expanded testimonial detail is a `<div hidden>` but not explicitly identified as a region (`role="region"`) with an accessible name; adding `aria-labelledby` can improve navigation context.
- Consider announcing collapse-all outcome via polite live region text (e.g., “All testimonials collapsed”).
- Ensure focus indicators are visible at 3:1 contrast against adjacent colors and remain obvious in dark/light variations.

## 5) Conversion and trust signaling

### Opportunities
- Add subtle CTA after testimonials: “See selected projects” or “Contact Michael” with context (“Based on similar work”).
- Add optional source badges (LinkedIn recommendation, direct client feedback, collaborator quote) where appropriate and truthful.
- Consider one short “results-oriented” testimonial with measurable outcome if available (engagement, completion, budget/time performance, audience impact).

---

## Recommended roadmap

## Phase 1: quick wins (1–3 hours)
1. Raise smallest testimonial text size to at least ~`0.95rem` on mobile.
2. Improve button accessible names (append person name in `aria-label`).
3. Hide/disable “Collapse all” until at least one testimonial is expanded.
4. Add optional helper text above list: “Use Read More to expand each testimonial.”

## Phase 2: medium improvements (0.5–1 day)
1. Add testimonial filters (chips): `Leadership`, `Coaching`, `Production`, `Creative Direction`.
2. Introduce one featured testimonial card with stronger visual prominence.
3. Add structured metadata (year/context tag) in each card where available.
4. Add polite live region updates for bulk actions.

## Phase 3: strategic enhancements (1–2 days)
1. A/B test card order strategies:
   - authority-first (most recognizable senior role first),
   - relevance-first (industry match),
   - recency-first.
2. Add lightweight analytics events:
   - testimonial expand rate,
   - collapse-all usage,
   - downstream CTA clicks after testimonial interaction.
3. Add schema enhancements if appropriate (multiple review entities and validation of schema eligibility).

---

## Accessibility best-practice checklist for testimonials

- Use semantic disclosure controls with explicit accessible names.
- Keep tap targets >= 44x44 CSS px.
- Maintain paragraph text around 16px-equivalent for comfortable reading on mobile.
- Verify color contrast for text and controls in all interactive states.
- Ensure focus order remains logical and does not trap users.
- Use `prefers-reduced-motion` consistently if any testimonial animations are added later.
- Provide deterministic keyboard behavior for any future carousel variant (if introduced).

---

## Optional redesign directions (choose one)

### Option A — Keep cards, improve trust and scanability (lowest risk)
- Keep current layout.
- Add filter chips and one featured card.
- Improve metadata and accessibility naming.

### Option B — Split view (list + detail panel)
- Left: compact list of people/themes.
- Right: full testimonial detail.
- Better for desktop comparability, but needs careful mobile adaptation.

### Option C — Accessible carousel (highest implementation risk)
- One testimonial at a time with previous/next controls and pause.
- Can improve narrative flow but often harms discoverability and accessibility if not done carefully.
- Only choose if storytelling flow is more important than rapid scanning.

---

## Suggested success metrics

- +20–30% increase in testimonial expansion rate.
- Increased click-through from testimonial section to `#contact`.
- Lower bounce rate for sessions reaching testimonials.
- No new WCAG AA contrast/focus issues in audits.

