const puppeteer = require('puppeteer');
const axeSource = require('axe-core').source;

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Inject axe-core into the page
  await page.addScriptTag({ content: axeSource });

  const results = await page.evaluate(async () => {
    return await axe.run();
  });

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
})();
