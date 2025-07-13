const fs = require('fs');
const https = require('https');

let key;
try {
  key = fs.readFileSync('indexnow.txt', 'utf8').trim();
} catch (err) {
  console.error('Failed to read indexnow.txt:', err.message);
  process.exit(1);
}

const urlList = [
  'https://michaelkuell.com/video-sitemap.xml',
  'https://michaelkuell.com/'
];

const data = JSON.stringify({
  host: 'michaelkuell.com',
  key,
  keyLocation: 'https://michaelkuell.com/indexnow.txt',
  urlList
});

const options = {
  hostname: 'api.indexnow.org',
  path: '/indexnow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    console.log('IndexNow response:', res.statusCode, body);
  });
});

req.on('error', err => {
  console.error('IndexNow request error:', err.message);
});

req.write(data);
req.end();
