const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 480, height: 800 });

  await page.route('**', route => {
    const url = route.request().url();
    if (url.endsWith('/api/contact')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    }
    if (url.startsWith('http') && !url.startsWith('file://')) {
      return route.fulfill({ status: 200, body: '' });
    }
    return route.continue();
  });

  await page.goto('file://' + path.join(process.cwd(), 'index.html'));
  await page.evaluate(() => {
    window.fetch = async () => new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  });

  const display = await page.evaluate(() => getComputedStyle(document.querySelector('.nav-toggle')).display);
  console.log('Nav toggle visible:', display !== 'none');

  await page.click('.nav-toggle');
  const navOpen = await page.evaluate(() => document.body.classList.contains('nav-open'));
  await page.click('.nav-toggle');
  const navClosed = await page.evaluate(() => !document.body.classList.contains('nav-open'));
  console.log('Hamburger toggles:', navOpen && navClosed);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.click('#logo-link');
  await page.waitForFunction(() => window.scrollY === 0);
  const atTop = await page.evaluate(() => window.scrollY === 0);
  console.log('Logo scrolls to top:', atTop);

  await page.evaluate(() => window.scrollTo(0, document.getElementById('bio').offsetTop + 10));
  await page.waitForTimeout(1000);
  const navActive = await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('nav a')).find(a => a.getAttribute('href') === '#bio');
    return link && link.classList.contains('active');
  });
  console.log('Nav link highlight:', navActive);

  await page.click('.play-button');
  await page.waitForSelector('#video-modal', { state: 'visible' });
  const modalOpen = await page.isVisible('#video-modal');
  await page.click('.modal-close');
  const modalClosed = await page.evaluate(() => document.getElementById('video-modal').hidden);
  console.log('Video modal works:', modalOpen && modalClosed);

  await page.fill('input[name=name]', 'Test User');
  await page.fill('input[name=email]', 'test@example.com');
  await page.fill('textarea[name=message]', 'Hello from an automated feature test.');
  await page.click('#contact-form button[type=submit]');
  await page.waitForSelector('#success-msg', { state: 'visible' });
  const successVisible = await page.isVisible('#success-msg');
  console.log('Contact form success:', successVisible);

  await browser.close();
})();
