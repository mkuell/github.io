# How-to: remaining audit items

These items need tools or service signups outside what was available during the in-session audit. Concise step-by-steps below — pick them off when you have time.

---

## 1. Compress `MK_background.jpg` and `MK_clay.jpg` to WebP

**Why:** Together these two JPEGs are ~1.1 MB. Converted to WebP at quality 78–80 they typically drop to ~140 KB total with no perceptible quality loss. This is the single biggest byte saving still on the table.

### Option A — squoosh.app (browser, no install)

1. Visit https://squoosh.app
2. Drag `assets/images/MK_background.jpg` into the page
3. In the right panel, switch the codec to **WebP**. Quality 78 is a good default for photos. AVIF saves more bytes but takes longer to encode.
4. Watch the file-size estimate — aim for ~60–80 KB for `MK_background.jpg`, ~80 KB for `MK_clay.jpg`.
5. Download as `MK_background.webp` / `MK_clay.webp`, place in `assets/images/`.

### Option B — cwebp CLI

```bash
brew install webp
cwebp -q 78 assets/images/MK_background.jpg -o assets/images/MK_background.webp
cwebp -q 80 assets/images/MK_clay.jpg -o assets/images/MK_clay.webp
```

### After converting — files to update

Every browser since 2020 supports WebP, so you can usually drop the JPEGs entirely. Update the references:

- `styles.css:521` — `.cover-page { background: ... url('assets/images/MK_clay.jpg') ... }`
- `styles.css:883` — `.bio-section { background: url('assets/images/MK_background.jpg') ... }`
- `styles.css:1004` — `#contact { background: url('assets/images/MK_background.jpg') ... }`
- `index.html:26` — `<meta property="og:image" content=".../MK_clay.jpg">`
- `index.html:108` — hero `<video poster="assets/images/MK_clay.jpg">`
- `index.html:448` — contact `<video poster="assets/images/MK_background.jpg">`
- `index.html` Twitter card image (after the OG block)
- `index.html` Person schema `image` field

If you want to keep the JPEGs as a fallback for ancient browsers, use a `<picture>` element for `<img>` tags and `image-set()` in CSS. For this site's audience it's not worth the markup complexity — just convert and replace.

---

## 2. Re-encode the background videos

**Why:** `cover-video.mp4` and `contact-video.mp4` are ~20 MB each. A 1080p 8-second hero loop should be 3–5 MB. Currently the cover video starts downloading on page load (now via `preload="metadata"` so only the metadata header, but visitors still pay the full size as soon as scroll triggers playback).

### Install ffmpeg

```bash
brew install ffmpeg
```

### Re-encode

```bash
# H.264 MP4 — broadly compatible, replaces existing .mp4 files
ffmpeg -i assets/videos/cover-video.mp4 \
  -c:v libx264 -crf 28 -preset slow \
  -vf "scale=1920:-2" -an -movflags +faststart \
  assets/videos/cover-video.optimized.mp4

# WebM (VP9) — smaller, modern browsers
ffmpeg -i assets/videos/cover-video.mp4 \
  -c:v libvpx-vp9 -crf 32 -b:v 0 \
  -vf "scale=1920:-2" -an \
  assets/videos/cover-video.optimized.webm
```

Repeat for `contact-video.mp4` / `.webm`.

### Knobs to tune

- **`-crf`** controls quality vs. size. Lower = larger file. 23 = high quality, 28 = good for hero loops, 32 = lower-quality mobile fallback. Try 28 first; bump to 26 if you see artifacts on bright/contrasty footage.
- **`-vf "scale=1920:-2"`** caps width at 1920 px (1080p). For mobile-only hero loops, `scale=1280:-2` (720p) saves another ~40%.
- **`-an`** strips audio (your clips have none).
- **`-movflags +faststart`** moves the MP4 metadata index to the start of the file so playback can begin before the file finishes downloading. Critical for inline `<video>`. WebM is faststart-style by default.
- **`-t 8`** trims to 8 seconds — useful if your source clip is longer than the loop you actually want.

### After re-encoding

Once you've verified the output looks good, swap the names:

```bash
mv assets/videos/cover-video.mp4 assets/videos/cover-video.original.mp4
mv assets/videos/cover-video.optimized.mp4 assets/videos/cover-video.mp4
# Same for .webm
```

(Keep originals around for a release or two until you're confident, then delete.)

---

## 3. Cloudflare Turnstile (stronger spam defense)

**Why:** the current contact API uses a honeypot + 2-second submission timing check. Both are easily defeated by a sophisticated bot or anyone testing with real-time browser automation. Turnstile is Cloudflare's free, invisible CAPTCHA that catches >95% of bot traffic with no user friction. About 5 minutes to set up.

### Steps

1. **Sign up** at https://dash.cloudflare.com/?to=/:account/turnstile (free, no credit card).
2. **Add a site** — give it a label, enter `michaelkuell.com` as the domain. Choose **Managed** mode (invisible to most users; only challenges on suspicion).
3. Copy the **Site Key** (public, safe to commit) and **Secret Key** (must stay server-side).
4. Add the Secret Key to Vercel as `TURNSTILE_SECRET_KEY` (Project → Settings → Environment Variables).

### Frontend (`index.html`)

Add to `<head>`:

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
```

Inside the contact form, just before the submit button, replace the existing honeypot block with:

```html
<div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
```

Turnstile auto-injects a hidden input named `cf-turnstile-response` once the user passes.

### Backend (`api/contact.js`)

After the body parse / data extraction, before sending the email:

```js
const tokenResp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: data['cf-turnstile-response'] || '',
    remoteip: req.headers['x-forwarded-for'] || ''
  })
});
const verifyResult = await tokenResp.json();
if (!verifyResult.success) {
  res.statusCode = 403;
  res.end('Forbidden');
  return;
}
```

Once Turnstile is wired up you can keep the honeypot + timing checks as belt-and-suspenders, or simplify by removing them — Turnstile alone is sufficient.

---

## 4. Verify the production hosting setup

**Worth a quick sanity check before you ship anything else.**

The `CNAME` file says `michaelkuell.com` (GitHub Pages convention). But `api/contact.js` uses Vercel/Netlify-style serverless function signatures, which GitHub Pages cannot execute. One of two things is true:

- **Site is actually on Vercel** — and the `CNAME` file is a leftover from an earlier GitHub Pages deploy (harmless but stale).
- **Site is on GitHub Pages** — and the contact form is currently 404-ing in production.

To check: open the live site, open the contact form in DevTools, submit a test message, and watch the Network tab. If `POST /api/contact` returns 200, you're on Vercel (or similar). If it returns 404 or `Method Not Allowed` on the static-hosting page, the API isn't being served.

If the form is broken: deploy via Vercel (free hobby tier; auto-detects the `api/` folder convention), point your domain at Vercel, delete `CNAME`.

---

## 5. Optional next steps (lower priority)

- **Service worker for offline + repeat-visit speed.** Workbox's `injectManifest` mode is the cleanest path. ~25 lines for a portfolio site. Caches static assets and lets the homepage load instantly on repeat visits.
- **Add `VideoObject` JSON-LD per portfolio video.** You have `video-sitemap.xml`, which Google reads, but per-video schema markup is more discoverable. With ~12 videos it's a chunk of JSON; consider doing it as a single `@graph` array rather than 12 separate `<script>` blocks.
- **Self-host favicon variants.** Currently only `favicon.ico`. Add `apple-touch-icon.png`, `manifest.json` for PWA-style installability, and proper `<link>` tags.
- **Add `<picture>` with `srcset` for the testimonial portrait images.** They're currently 23 KB to 116 KB — fine on desktop but the larger ones could ship a 60% smaller mobile variant.
