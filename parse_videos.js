const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function extractFromFile(filePath, baseUrl) {
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const wrappers = Array.from(document.querySelectorAll('[data-src^="https://player.vimeo.com/video/"]'));
  return wrappers.map(wrapper => {
    const playerUrl = wrapper.getAttribute('data-src');
    const img = wrapper.querySelector('img');
    const button = wrapper.querySelector('button');
    return {
      pageUrl: baseUrl,
      playerUrl,
      thumbnailUrl: img ? img.getAttribute('src') : '',
      title: wrapper.getAttribute('data-title') || (button && button.getAttribute('aria-label')) || '',
      description: wrapper.getAttribute('data-description') || '',
      uploadDate: wrapper.getAttribute('data-upload-date') || '',
      duration: wrapper.getAttribute('data-duration') ? parseInt(wrapper.getAttribute('data-duration'), 10) : null
    };
  });
}

const siteUrl = 'https://michaelkuell.com/';
const data = [];

data.push(...extractFromFile('index.html', siteUrl));

fs.writeFileSync('videos.json', JSON.stringify(data, null, 2));
