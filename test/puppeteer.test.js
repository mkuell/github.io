const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 480, height: 800 });

  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    if (url.endsWith('/api/contact')) {
      return req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    }
    if (url.startsWith('http') && !url.startsWith('file://')) {
      return req.respond({ status: 200, body: '' });
    }
    return req.continue();
  });

  await page.goto('file://' + path.join(process.cwd(), 'index.html'), { waitUntil: 'networkidle0' });

  await page.click('.nav-toggle');
  await page.waitForFunction(() => (
    document.body.classList.contains('nav-open') &&
    document.querySelector('.nav-toggle').getAttribute('aria-expanded') === 'true'
  ));

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.click('#logo-link');
  await page.waitForFunction(() => window.scrollY === 0);

  await page.click('.video-wrapper .play-button');
  await page.waitForSelector('#video-modal:not([hidden])');
  await page.waitForFunction(() => {
    const iframe = document.querySelector('#video-modal iframe');
    return iframe && new URL(iframe.src).searchParams.get('autoplay') === '1';
  });
  await page.click('.modal-close');
  await page.waitForFunction(() => document.getElementById('video-modal').hidden);

  await page.type('#contact-form input[name="name"]', 'Test User');
  await page.type('#contact-form input[name="email"]', 'test@example.com');
  await page.type('#contact-form textarea[name="message"]', 'Hello from an automated smoke test.');
  await page.click('#contact-form button[type="submit"]');
  await page.waitForSelector('#success-msg:not([hidden])');

  await browser.close();
})();
