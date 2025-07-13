# Performance and Accessibility Audit

This document outlines improvements made to optimize load times and accessibility.

## Automated Audits

`npm run audit` will run Lighthouse and axe-core against a local development server. Both tools require Chrome to be available in the environment.

```bash
npm run audit
```

If Chrome is not installed, the script will fail with a message similar to *Unable to connect to Chrome*.

## Key Fixes Implemented

- **Lazy Loading** – all decorative divider images and dynamically created video iframes now include `loading="lazy"`.
- **Critical CSS** – small above-the-fold styles are inlined; main stylesheet is loaded with `media="print"` trick and preloaded to avoid render blocking.
- **Minified Assets** – created `styles.min.css` and `script.min.js` and updated HTML pages to use the minified versions. Fonts and scripts are preloaded for faster fetch.
- **Deferred Scripts** – third-party libraries and custom scripts now load with `defer` to prevent blocking rendering.

## Manual Checks

Keyboard navigation was tested for all major interactive components. The video modal and accordion announce state changes via ARIA attributes and provide focus outlines.

## Running Audits Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start a local server:
   ```bash
   npx http-server -p 8080
   ```
3. In another terminal, run:
   ```bash
   npm run audit
   ```

The resulting Lighthouse and axe reports provide metrics for First Contentful Paint, Largest Contentful Paint, cumulative layout shift, and accessibility violations.
