const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 480, height: 800 });
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    if (url.startsWith('http') && !url.startsWith('file://')) {
      req.respond({ status: 200, body: '' });
    } else {
      req.continue();
    }
  });
  await page.goto('file://' + path.join(process.cwd(), 'index.html'), { waitUntil: 'networkidle0' });

  // 1. Hamburger menu toggles body.nav-open
  await page.click('.nav-toggle');
  await page.waitForFunction(() => document.body.classList.contains('nav-open'));

  // 2. Click logo and ensure page scrolled to top
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.click('#logo-link');
  await page.waitForFunction(() => window.scrollY === 0);

  // 3. Expand first accordion section
  await page.click('.accordion .toggle');
  await page.waitForSelector('.accordion .content:not([hidden])');

  // 4. Open video modal from first thumbnail and verify autoplay
  await page.click('.video-wrapper .play-button');
  await page.waitForSelector('#video-modal:not([hidden])');
  await page.waitForFunction(() => {
    const iframe = document.querySelector('#video-modal iframe');
    return iframe && iframe.src.includes('autoplay=1');
  });

  // 5. Submit contact form and confirm success message
  await page.type('#contact-form input[name="name"]', 'Test User');
  await page.type('#contact-form input[name="email"]', 'test@example.com');
  await page.type('#contact-form textarea[name="message"]', 'Hello!');
  await page.click('#contact-form button[type="submit"]');
  await page.waitForSelector('#success-msg:not([hidden])');

  await browser.close();
})();
