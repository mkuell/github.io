const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const breakpoints = [
    { label: 'mobile', width: 375, height: 800 },
    { label: 'tablet', width: 768, height: 800 },
    { label: 'desktop', width: 1280, height: 800 }
  ];

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const results = [];

  for (const bp of breakpoints) {
    const page = await browser.newPage();
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.goto('file://' + path.join(process.cwd(), 'index.html'), { waitUntil: 'networkidle0' });

    const overlayBox = await page.evaluate(() => {
      const r = document.querySelector('.hero-overlay').getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    const mainFont = await page.$eval('.main-title', el => getComputedStyle(el).fontSize);
    const subFont = await page.$eval('.sub-title', el => getComputedStyle(el).fontSize);
    const { ctaVisible } = await page.evaluate(() => {
      const rect = document.querySelector('.hero-cta').getBoundingClientRect();
      return { ctaVisible: rect.bottom <= window.innerHeight };
    });

    results.push({
      viewport: `${bp.width}x${bp.height}`,
      mainFont,
      subFont,
      overlayWidth: overlayBox.width,
      overlayHeight: overlayBox.height,
      ctaVisible
    });

    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
