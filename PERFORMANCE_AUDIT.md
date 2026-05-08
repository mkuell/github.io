# Performance and Accessibility Notes

This document describes what's actually shipped and what's available as tooling. Keep it honest — update it when reality changes.

## Currently shipped in production

- **Lazy loading on images** — divider SVGs and YouTube/Vimeo thumbnails use `loading="lazy"`.
- **Deferred background-video loading** — IntersectionObserver in `script.js` loads video sources only when each `<video>` enters the viewport, and pauses when it leaves.
- **Reduced-motion handling for videos** — `prefers-reduced-motion` pauses background videos and hides them via CSS.
- **Hero video uses `preload="metadata"`** — does not pre-download the full ~20 MB clip on first paint.
- **Keyboard-accessible video modal** — focus trap, Escape to close, focus restored on close.
- **Disclosure pattern for "Read More"** — `aria-expanded`, `aria-controls`, focus moved to revealed content.
- **`prefers-reduced-motion` is checked for background videos**, but `html { scroll-behavior: smooth }` and AOS animations are not yet gated on the preference.

## Available but NOT currently shipped

- **Minification** — `npm run build` produces `styles.min.css` and `script.min.js` via PurgeCSS, clean-css, and terser. **Production currently references the unminified `styles.css` and `script.js`** because GitHub Pages has no build step and the workflow trap (forgetting to rebuild before push) outweighs the ~5–8 KB gzipped wire savings for this site's traffic. The `.min` files are gitignored as build artifacts. To wire them up later, either add a GitHub Action that builds on push and commits the result, or run `npm run build` manually before each deploy and ship the artifacts.
- **Critical CSS inlining** — not done. The above-the-fold styles ship in the main stylesheet via a normal blocking `<link>`.
- **Font preloading** — fonts are loaded via Google Fonts `<link>` with `preconnect` hints, not preloaded.

## Bigger fish than minification

The largest remaining wins, ranked by byte savings:

1. **`assets/images/MK_background.jpg` (882 KB)** is used as a `background-image` twice (`#bio`, `#contact`) with `background-attachment: fixed`. Convert to `.webp`/`.avif` (~60 KB) and consider dropping `fixed` on small screens — `fixed` forces full-area repaints on scroll.
2. **`assets/images/MK_clay.jpg` (229 KB)** — hero poster. Compress to ~80 KB as `.webp`.
3. **Self-host AOS** — currently loaded from `unpkg.com`, costing a fresh DNS lookup + TLS handshake. AOS is ~14 KB; bundle it into the repo.
4. **Background videos (~20 MB each, two clips)** — re-encode at lower bitrate. A 1080p hero loop should be 3–5 MB, not 20 MB. Consider serving a much smaller mobile-specific clip via `<source media="...">`.

## Tooling

```bash
# Run a local server
npx http-server -p 8080

# Lighthouse + axe (requires Chrome)
npm run audit

# HTML validation
npm test

# Puppeteer feature checks
npm run test:puppeteer

# Technical audit (custom)
npm run audit:technical

# Build the (currently unshipped) min files
npm run build
```

## Manual checks performed

Keyboard navigation has been verified for:
- Skip-to-main link
- Site nav (open, close, ESC, focus retention)
- Video modal (open, focus trap, ESC, close, focus restoration)
- Disclosure toggles (Read More / Read Less)
- Contact form (validation, error focus, submission state)
