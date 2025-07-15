const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 480, height: 800 });

  await page.route('**', route => {
    const url = route.request().url();
    if (url.startsWith('http') && !url.startsWith('file://')) {
      return route.fulfill({ status: 200, body: '' });
    }
    return route.continue();
  });

  await page.goto('file://' + path.join(process.cwd(), 'index.html'));
  const display = await page.evaluate(() => getComputedStyle(document.querySelector('.nav-toggle')).display);
  console.log('Nav toggle display:', display);

  // 1. Hamburger opens/closes nav
  await page.click('.nav-toggle');
  const navOpen = await page.evaluate(() => document.body.classList.contains('nav-open'));
  await page.click('.nav-toggle');
  const navClosed = await page.evaluate(() => !document.body.classList.contains('nav-open'));
  console.log('Hamburger toggles:', navOpen && navClosed);

  // 2. Clicking the logo scrolls to top
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.click('#logo-link');
  await page.waitForTimeout(500);
  const atTop = await page.evaluate(() => window.scrollY === 0);
  console.log('Logo scrolls to top:', atTop);

  // 3. Bio section toggles
  const firstToggle = await page.locator('.bio-toggle').first();
  await firstToggle.click();
  const bioExpanded = await firstToggle.getAttribute('aria-expanded') === 'true' &&
    await page.evaluate(() => document.querySelector('.bio-card.expanded'));
  await firstToggle.click();
  const bioCollapsed = await firstToggle.getAttribute('aria-expanded') === 'false' &&
    await page.evaluate(() => !document.querySelector('.bio-card.expanded'));
  console.log('Bio toggles:', bioExpanded && bioCollapsed);

  // 4. Navigation link highlights on scroll
  await page.evaluate(() => window.scrollTo(0, document.getElementById('bio').offsetTop + 10));
  await page.waitForTimeout(1000);
  const navActive = await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('nav a')).find(a => a.getAttribute('href') === '#bio');
    return link && link.classList.contains('active');
  });
  console.log('Nav link highlight:', navActive);

  // 5. Video modal opens and closes
  await page.click('.play-button');
  await page.waitForSelector('#video-modal', { state: 'visible' });
  const modalOpen = await page.isVisible('#video-modal');
  await page.click('.modal-close');
  const modalClosed = await page.evaluate(() => document.getElementById('video-modal').hidden);
  console.log('Video modal works:', modalOpen && modalClosed);

  // 6. Contact form submits
  await page.fill('input[name=name]', 'Test');
  await page.fill('input[name=email]', 'test@example.com');
  await page.fill('textarea[name=message]', 'Hello');
  await page.click('#contact-form button[type=submit]');
  await page.waitForSelector('#success-msg', { state: 'visible' });
  const successVisible = await page.isVisible('#success-msg');
  const formHidden = await page.evaluate(() => document.getElementById('contact-form').hidden);
  console.log('Contact form success:', successVisible && formHidden);

  await browser.close();
})();
