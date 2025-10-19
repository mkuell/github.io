Personal Website and Online Video Portfolio for <strong>Producer and Director Michael Kuell</strong>

🙋‍♂️ <strong>About Me -</strong>

I am a Creative Producer with many years of experience in video production and storytelling.

I have worked across <strong>healthcare, finance, education, tech,</strong> and more, managing everything from <strong>live-action documentaries to corporate campaigns.</strong>
You name it, I've worked on it.
Along the way, I have mastered the art of balancing big-picture strategy with the nitty-gritty details like scheduling and budgets to keep projects on track and teams energized. 
My focus is on making the process as smooth as possible for everyone involved while delivering <strong>high-quality content</strong> that makes an <strong>impact</strong>.

📫 michael@michaelkuell.com
https://www.linkedin.com/in/mikekuell/
https://vimeo.com/jetpak
https://www.instagram.com/michael_kuell/

## Setup

1. Run `npm install` to install dependencies.
2. Run `npm run lint` to check for unused variables and functions.
3. Use `npm run build` to purge unused CSS and generate `styles.min.css` and `script.min.js`.
4. Run `npm test` to validate HTML.
5. Run `npm run test:axe` to scan the homepage with axe-core.
6. Run `npm run audit:technical` to generate Core Web Vitals, indexing, and crawl budget reports. Pass a production URL with `AUDIT_URL="https://example.com" npm run audit:technical` when auditing a deployed site.

Audit reports are written to `/reports/technical-audit.json` and `/reports/technical-audit.md` with prioritized fixes and impact scores.

## Environment Variables

The `/api/contact` function uses Nodemailer to send form submissions. Configure the following variables in your hosting provider:

* `SMTP_HOST` – SMTP server host
* `SMTP_PORT` – SMTP server port
* `SMTP_USER` – SMTP username
* `SMTP_PASS` – SMTP password
* `SMTP_SECURE` – set to `true` if the server requires TLS (optional)
* `FROM_EMAIL` – email address to use in the `from` field (optional, defaults to `SMTP_USER`)
