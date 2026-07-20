const puppeteer = require('puppeteer');
const axeSource = require('axe-core').source;
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PORT = 3000;

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.resolve(ROOT, `.${pathname}`);

  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
    });
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(PORT, resolve));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    if (url.startsWith(`http://localhost:${PORT}`)) {
      return req.continue();
    }
    if (url.startsWith('http')) {
      return req.respond({ status: 200, body: '' });
    }
    return req.continue();
  });

  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
  await page.addScriptTag({ content: axeSource });

  const results = await page.evaluate(async () => axe.run());

  if (results.violations.length) {
    results.violations.forEach(v => {
      console.log(`${v.impact}: ${v.description}`);
      v.nodes.forEach(n => console.log('  Selector:', n.target.join(' ')));
    });
    process.exitCode = 1;
  } else {
    console.log('No accessibility violations found.');
  }

  await browser.close();
  server.close();
})();
