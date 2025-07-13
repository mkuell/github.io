const fs = require('fs');

const ROBOTS_PATH = 'robots.txt';
const VIDEO_LINE = 'Sitemap: https://michaelkuell.com/video-sitemap.xml';

let content;
try {
  content = fs.readFileSync(ROBOTS_PATH, 'utf8').split(/\r?\n/);
} catch (err) {
  console.error(`Failed to read ${ROBOTS_PATH}:`, err.message);
  process.exit(1);
}

if (!content.includes(VIDEO_LINE)) {
  content.push(VIDEO_LINE);
  try {
    fs.writeFileSync(ROBOTS_PATH, content.join('\n') + '\n');
    console.log('Added video sitemap entry to robots.txt');
  } catch (err) {
    console.error(`Failed to write ${ROBOTS_PATH}:`, err.message);
    process.exit(1);
  }
} else {
  console.log('robots.txt already includes video sitemap');
}
