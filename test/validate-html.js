const { HTMLHint } = require('htmlhint');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const messages = HTMLHint.verify(html, {});

if (messages.length > 0) {
  console.error('HTMLHint errors found:');
  messages.forEach(msg => {
    console.error(`${msg.line}:${msg.col} ${msg.message} (${msg.rule.id})`);
  });
  process.exit(1);
} else {
  console.log('HTML looks good.');
}
