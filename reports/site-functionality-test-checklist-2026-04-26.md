# Site Functionality Test Checklist (Updated for current website)

Use this as a manual QA run for `index.html` / production deploy.

## Test & Commit request (updated)

1. Load the site in a browser (mobile width ~375–480px for nav checks, then desktop width for scroll checks), then confirm:
   - ☑️ **Hamburger opens/closes nav**: tapping `.nav-toggle` toggles `body.nav-open`, updates `aria-expanded` (`false` → `true` → `false`), and shows/hides `.nav-list`.
   - ☑️ **Clicking the logo scrolls to top**: clicking `#logo-link` smoothly returns to `window.scrollY === 0`.
   - ☑️ **Bio “Read More/Read Less” toggles**: in `#bio`, each `.teaser-toggle` toggles its associated `.teaser-full` panel visibility and updates button text.
   - ☑️ **Navigation links highlight on scroll**: while scrolling sections (`#portfolio`, `#testimonials`, `#bio`, `#contact`), matching nav link in `.nav-list a` gets `.active`.
   - ☑️ **Video cards open/close modal playback**: clicking a `.play-button` (or `.work-card__cta`) opens `#video-modal` with an iframe URL containing `autoplay=1`; close via `.modal-close`, backdrop click, and `Escape`.
   - ☑️ **Contact form success UX (updated)**: submitting a valid `#contact-form` shows `#success-msg` and success text in `#form-status`; the form is reset and remains visible (it is **not** hidden).

## Pass/fail rubric

- **PASS**: every assertion above is reproducible without console errors.
- **FAIL**: any selector/state mismatch, missing success message, modal not closing, or nav state inconsistency.

## Suggested evidence to attach with commit

- Short screen recording or screenshots of:
  1. nav open/close,
  2. bio disclosure open,
  3. active nav highlight,
  4. modal open + close,
  5. contact success message visible.
- Include browser + viewport used (e.g., "Chrome 124, 390x844" and "Chrome 124, 1440x900").
