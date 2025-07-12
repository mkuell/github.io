const fs = require('fs');

const ROBOTS_PATH = 'robots.txt';
const VIDEO_LINE = 'Sitemap: https://michaelkuell.com/video-sitemap.xml';

const content = fs.readFileSync(ROBOTS_PATH, 'utf8').split(/\r?\n/);

if (!content.includes(VIDEO_LINE)) {
  content.push(VIDEO_LINE);
  fs.writeFileSync(ROBOTS_PATH, content.join('\n') + '\n');
  console.log('Added video sitemap entry to robots.txt');
} else {
  console.log('robots.txt already includes video sitemap');
}
