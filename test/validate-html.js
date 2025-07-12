const { HTMLHint } = require('htmlhint');
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('index.html', 'utf8');
const messages = HTMLHint.verify(html, {});

if (messages.length > 0) {
  console.error('HTMLHint errors found:');
  messages.forEach(msg => {
    console.error(`${msg.line}:${msg.col} ${msg.message} (${msg.rule.id})`);
  });
  process.exit(1);
} else {
  // Additional check: ensure all in-page links target existing IDs
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const missing = [];

  doc.querySelectorAll('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href').slice(1);
    if (id && !doc.getElementById(id)) {
      missing.push(id);
    }
  });

  doc.querySelectorAll('[onclick*="scrollTo("]').forEach(el => {
    const match = el.getAttribute('onclick').match(/scrollTo\('([^']+)'\)/);
    if (match && !doc.querySelector(match[1])) {
      missing.push(match[1]);
    }
  });

  if (missing.length) {
    console.error('Missing DOM targets for links or buttons:', missing);
    process.exit(1);
  }

  console.log('HTML looks good.');
}
