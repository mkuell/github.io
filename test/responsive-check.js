const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const breakpoints = [
    { label: 'narrow mobile', width: 320, height: 800 },
    { label: 'mobile', width: 375, height: 800 },
    { label: 'tablet', width: 768, height: 900 },
    { label: 'desktop', width: 1280, height: 900 }
  ];

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const results = [];

  for (const bp of breakpoints) {
    const page = await browser.newPage();
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.setRequestInterception(true);
    page.on('request', req => {
      const url = req.url();
      if (url.startsWith('http') && !url.startsWith('file://')) {
        return req.respond({ status: 200, body: '' });
      }
      return req.continue();
    });

    await page.goto('file://' + path.join(process.cwd(), 'index.html'), { waitUntil: 'networkidle0' });

    const metrics = await page.evaluate(() => {
      const heroLockup = document.querySelector('.hero-lockup').getBoundingClientRect();
      const heroScrollLink = document.querySelector('.hero-scroll-link').getBoundingClientRect();
      const navToggleDisplay = getComputedStyle(document.querySelector('.nav-toggle')).display;
      const gridColumns = getComputedStyle(document.querySelector('.portfolio-grid')).gridTemplateColumns.split(' ').length;

      return {
        noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
        heroLockupVisible: heroLockup.bottom <= window.innerHeight && heroLockup.right <= window.innerWidth,
        heroScrollLinkVisible: heroScrollLink.bottom <= window.innerHeight && heroScrollLink.right <= window.innerWidth,
        navToggleStateCorrect: window.innerWidth <= 768 ? navToggleDisplay !== 'none' : navToggleDisplay === 'none',
        gridColumns
      };
    });

    if (bp.width <= 768) {
      await page.click('.nav-toggle');
      metrics.mobileNavOpens = await page.evaluate(() => (
        document.body.classList.contains('nav-open') &&
        document.querySelector('.nav-list').dataset.visible === 'true' &&
        document.querySelector('.nav-toggle').getAttribute('aria-expanded') === 'true'
      ));
    }

    results.push({ viewport: `${bp.width}x${bp.height}`, label: bp.label, ...metrics });
    await page.close();
  }

  await browser.close();

  const failures = results.flatMap(result => Object.entries(result)
    .filter(([key, value]) => typeof value === 'boolean' && value === false)
    .map(([key]) => `${result.label}: ${key}`));

  console.log(JSON.stringify(results, null, 2));

  if (failures.length > 0) {
    console.error('Responsive check failures:', failures.join(', '));
    process.exit(1);
  }
})();
