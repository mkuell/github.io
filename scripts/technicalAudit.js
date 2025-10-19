#!/usr/bin/env node
/*
 * Technical audit generator for michaelkuell.com
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const { XMLParser } = require('fast-xml-parser');

const fetchFn = global.fetch
  ? (...args) => global.fetch(...args)
  : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const REPO_ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(REPO_ROOT, 'reports');
const DEFAULT_URL = 'https://michaelkuell.com/';
const TARGET_URL = process.argv[2] || process.env.AUDIT_URL || DEFAULT_URL;

function formatScore(value) {
  if (value === undefined || value === null) {
    return null;
  }
  return Math.round(value * 100);
}

async function runLighthouse(url, formFactor) {
  let chrome;
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox'],
    });
  } catch (error) {
    return {
      error: `Unable to launch Chrome for Lighthouse (${error.message}). Install Chrome or run inside a Chrome-enabled environment.`,
    };
  }

  try {
    const opts = {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'seo', 'best-practices'],
      formFactor,
      screenEmulation: formFactor === 'desktop' ? { disabled: true } : undefined,
    };
    const config = {
      extends: 'lighthouse:default',
    };

    const runnerResult = await lighthouse(url, opts, config);
    return { lhr: runnerResult.lhr };
  } catch (error) {
    return {
      error: `Lighthouse failed for ${formFactor} mode: ${error.message}`,
    };
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

function parseMetric(lhr, id) {
  if (!lhr) return null;
  const audit = lhr.audits?.[id];
  if (!audit) return null;
  return {
    value: audit.numericValue || null,
    display: audit.displayValue || null,
    score: audit.score === null || audit.score === undefined ? null : Math.round(audit.score * 100),
  };
}

function collectHtmlFiles(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules' || entry.name === 'reports') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function analyzeHtmlFile(filePath, baseUrl) {
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const canonical = document.querySelector('link[rel="canonical"]');
  const robotsMeta = document.querySelector('meta[name="robots"]');
  const links = Array.from(document.querySelectorAll('a[href]'));

  const internalLinks = links.filter((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href) return false;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    try {
      const parsed = new URL(href, baseUrl);
      return parsed.hostname === new URL(baseUrl).hostname;
    } catch (error) {
      return false;
    }
  });

  return {
    path: filePath,
    canonicalPresent: Boolean(canonical),
    robotsMeta: robotsMeta ? robotsMeta.getAttribute('content') : null,
    internalLinkCount: internalLinks.length,
  };
}

function parseRobots(basePath) {
  const robotsPath = path.join(basePath, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    return {
      disallow: [],
      crawlDelay: null,
    };
  }
  const lines = fs.readFileSync(robotsPath, 'utf8').split(/\r?\n/);
  const disallow = [];
  let crawlDelay = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [directive, value] = trimmed.split(':').map((item) => item && item.trim());
    if (!directive || !value) continue;
    const lower = directive.toLowerCase();
    if (lower === 'disallow' && value !== '') {
      disallow.push(value);
    }
    if (lower === 'crawl-delay') {
      crawlDelay = Number(value);
    }
  }
  return { disallow, crawlDelay };
}

function isBlocked(pathname, disallowRules) {
  return disallowRules.some((rule) => {
    if (!rule) return false;
    if (rule === '/') return true;
    return pathname.startsWith(rule);
  });
}

async function evaluateSitemap(basePath, baseUrl, disallowRules) {
  const sitemapPath = path.join(basePath, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    return {
      urls: [],
      blocked: 0,
      unreachable: 0,
      reachable: 0,
    };
  }
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const data = parser.parse(xml);
  const urlNodes = data?.urlset?.url;
  if (!urlNodes) {
    return {
      urls: [],
      blocked: 0,
      unreachable: 0,
      reachable: 0,
    };
  }
  const urls = Array.isArray(urlNodes) ? urlNodes : [urlNodes];
  const hostname = new URL(baseUrl).hostname;
  let blocked = 0;
  let unreachable = 0;
  const results = [];

  for (const node of urls) {
    if (!node.loc) continue;
    const url = node.loc.trim();
    let status = 'unknown';
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;
      if (parsed.hostname === hostname && isBlocked(pathname, disallowRules)) {
        blocked += 1;
        status = 'blocked by robots';
      } else {
        const headResponse = await fetchFn(url, { method: 'HEAD' });
        if (!headResponse.ok) {
          const getResponse = await fetchFn(url, { method: 'GET' });
          status = getResponse.ok ? 'reachable' : `HTTP ${getResponse.status}`;
          if (!getResponse.ok) {
            unreachable += 1;
          }
        } else {
          status = 'reachable';
        }
      }
    } catch (error) {
      unreachable += 1;
      status = `error: ${error.message}`;
    }
    results.push({ url, status });
  }

  const reachable = results.filter((item) => item.status === 'reachable').length;
  return { urls: results, blocked, unreachable, reachable };
}

function summarizeHtmlInsights(htmlInsights) {
  const totalInternalLinks = htmlInsights.reduce((sum, item) => sum + item.internalLinkCount, 0);
  const averageInternalLinks = htmlInsights.length ? totalInternalLinks / htmlInsights.length : 0;
  const pagesMissingCanonical = htmlInsights.filter((item) => !item.canonicalPresent).map((item) => item.path);
  const pagesWithNoindex = htmlInsights
    .filter((item) => item.robotsMeta && item.robotsMeta.toLowerCase().includes('noindex'))
    .map((item) => item.path);

  return {
    totalPages: htmlInsights.length,
    averageInternalLinks: Number(averageInternalLinks.toFixed(2)),
    pagesMissingCanonical,
    pagesWithNoindex,
  };
}

function computeCrawlBudget(indexSummary, sitemapSummary) {
  const totalDiscovered = Math.max(indexSummary.totalPages, sitemapSummary.urls.length);
  const blocked = sitemapSummary.blocked + indexSummary.pagesWithNoindex.length;
  const percentBlocked = totalDiscovered ? Number(((blocked / totalDiscovered) * 100).toFixed(2)) : 0;
  const efficiency = totalDiscovered
    ? Number(((sitemapSummary.reachable / totalDiscovered) * 100).toFixed(2))
    : 0;
  return {
    totalDiscovered,
    blocked,
    percentBlocked,
    efficiency,
  };
}

function buildPriorityList(report) {
  const priorities = [];
  const mobileScore = report.coreWebVitals.mobile?.performanceScore;
  const desktopScore = report.coreWebVitals.desktop?.performanceScore;
  const lcpMobile = report.coreWebVitals.mobile?.metrics?.lcp?.value;
  const clsMobile = report.coreWebVitals.mobile?.metrics?.cls?.value;

  if (typeof mobileScore === 'number' && mobileScore < 75) {
    priorities.push({
      area: 'Mobile Performance',
      impactScore: 9,
      priority: 'High',
      summary: 'Improve mobile performance score',
      rationale: `Mobile Lighthouse performance scored ${mobileScore}. Optimize critical rendering path, compress hero media, and defer non-critical JavaScript.`,
    });
  }

  if (typeof desktopScore === 'number' && desktopScore < 90) {
    priorities.push({
      area: 'Desktop Performance',
      impactScore: 7,
      priority: 'High',
      summary: 'Raise desktop Core Web Vitals',
      rationale: `Desktop performance scored ${desktopScore}. Audit render-blocking requests and image sizes for desktop hero sections.`,
    });
  }

  if (lcpMobile && lcpMobile > 2500) {
    priorities.push({
      area: 'Largest Contentful Paint',
      impactScore: 8,
      priority: 'High',
      summary: 'Reduce Largest Contentful Paint on mobile',
      rationale: `LCP measured at ${(lcpMobile / 1000).toFixed(2)}s on mobile. Consider serving responsive hero images, enabling server-side caching, and preloading critical resources.`,
    });
  }

  if (clsMobile && clsMobile > 0.1) {
    priorities.push({
      area: 'Cumulative Layout Shift',
      impactScore: 6,
      priority: 'Medium',
      summary: 'Stabilize layout shifts',
      rationale: `CLS registered at ${clsMobile.toFixed(3)}. Reserve space for images and embeds and avoid injecting DOM elements above existing content.`,
    });
  }

  const indexSummary = report.indexing;
  if (indexSummary.pagesMissingCanonical.length) {
    priorities.push({
      area: 'Indexing Hygiene',
      impactScore: 7,
      priority: 'High',
      summary: 'Add canonical URLs to pages',
      rationale: `${indexSummary.pagesMissingCanonical.length} HTML file(s) are missing canonical tags. Configure <link rel="canonical"> to prevent duplicate indexing.`,
    });
  }

  if (indexSummary.pagesWithNoindex.length) {
    priorities.push({
      area: 'Index Coverage',
      impactScore: 5,
      priority: 'Medium',
      summary: 'Review noindex directives',
      rationale: `${indexSummary.pagesWithNoindex.length} page(s) include a noindex directive. Confirm they should remain excluded to avoid wasting crawl budget.`,
    });
  }

  const crawlBudget = report.crawlBudget;
  if (crawlBudget.percentBlocked > 10) {
    priorities.push({
      area: 'Crawl Budget',
      impactScore: 8,
      priority: 'High',
      summary: 'Reduce blocked URLs',
      rationale: `${crawlBudget.percentBlocked}% of discovered URLs are blocked or non-indexable. Streamline sitemap entries and robots rules to focus crawlers on valuable pages.`,
    });
  }

  if (!priorities.length) {
    priorities.push({
      area: 'All Systems',
      impactScore: 3,
      priority: 'Low',
      summary: 'Maintain current optimizations',
      rationale: 'No high-impact issues detected. Continue monitoring Core Web Vitals and crawl logs monthly.',
    });
  }

  return priorities;
}

function lighthouseSummary(lhr) {
  if (!lhr) return null;
  const performance = formatScore(lhr.categories?.performance?.score);
  const seo = formatScore(lhr.categories?.seo?.score);
  const bestPractices = formatScore(lhr.categories?.['best-practices']?.score);
  const metrics = {
    fcp: parseMetric(lhr, 'first-contentful-paint'),
    lcp: parseMetric(lhr, 'largest-contentful-paint'),
    tbt: parseMetric(lhr, 'total-blocking-time'),
    cls: parseMetric(lhr, 'cumulative-layout-shift'),
    si: parseMetric(lhr, 'speed-index'),
  };
  return {
    performanceScore: performance,
    seoScore: seo,
    bestPracticesScore: bestPractices,
    metrics,
  };
}

function createReport(coreResults, htmlSummary, sitemapSummary, crawlSummary) {
  return {
    generatedAt: new Date().toISOString(),
    targetUrl: TARGET_URL,
    coreWebVitals: {
      desktop: coreResults.desktop,
      mobile: coreResults.mobile,
    },
    indexing: htmlSummary,
    sitemap: sitemapSummary,
    crawlBudget: crawlSummary,
  };
}

function reportToMarkdown(report, priorities) {
  const lines = [];
  lines.push(`# Technical Audit Report`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Target URL: ${report.targetUrl}`);
  lines.push('');

  lines.push('## Core Web Vitals Performance');
  const desktop = report.coreWebVitals.desktop;
  const mobile = report.coreWebVitals.mobile;
  const formatMetrics = (label, data) => {
    if (!data) {
      lines.push(`- ${label}: Unable to run Lighthouse (see JSON report for details).`);
      return;
    }
    lines.push(`- ${label} Performance Score: ${data.performanceScore ?? 'n/a'} / 100`);
    lines.push(`  - Largest Contentful Paint: ${data.metrics.lcp?.display ?? 'n/a'}`);
    lines.push(`  - First Contentful Paint: ${data.metrics.fcp?.display ?? 'n/a'}`);
    lines.push(`  - Total Blocking Time: ${data.metrics.tbt?.display ?? 'n/a'}`);
    lines.push(`  - Cumulative Layout Shift: ${data.metrics.cls?.display ?? 'n/a'}`);
  };
  formatMetrics('Desktop', desktop);
  formatMetrics('Mobile', mobile);
  lines.push('');

  lines.push('## Mobile Experience');
  if (mobile) {
    lines.push(`- Mobile SEO Score: ${mobile.seoScore ?? 'n/a'} / 100`);
    lines.push(`- Mobile Best Practices Score: ${mobile.bestPracticesScore ?? 'n/a'} / 100`);
  } else {
    lines.push('- Unable to collect mobile experience data.');
  }
  lines.push('');

  lines.push('## Indexing Efficiency');
  lines.push(`- Total HTML Pages Reviewed: ${report.indexing.totalPages}`);
  lines.push(`- Average Internal Links per Page: ${report.indexing.averageInternalLinks}`);
  lines.push(`- Pages Missing Canonical: ${report.indexing.pagesMissingCanonical.length}`);
  lines.push(`- Pages with noindex: ${report.indexing.pagesWithNoindex.length}`);
  if (report.indexing.pagesMissingCanonical.length) {
    lines.push('  - Missing canonical on:');
    for (const item of report.indexing.pagesMissingCanonical) {
      lines.push(`    - ${path.relative(REPO_ROOT, item)}`);
    }
  }
  if (report.indexing.pagesWithNoindex.length) {
    lines.push('  - Pages marked noindex:');
    for (const item of report.indexing.pagesWithNoindex) {
      lines.push(`    - ${path.relative(REPO_ROOT, item)}`);
    }
  }
  lines.push('');

  lines.push('## Sitemap & Crawl Budget');
  lines.push(`- Sitemap URLs: ${report.sitemap.urls.length}`);
  lines.push(`- Reachable URLs: ${report.sitemap.reachable}`);
  lines.push(`- Blocked URLs (robots): ${report.sitemap.blocked}`);
  lines.push(`- Unreachable URLs: ${report.sitemap.unreachable}`);
  lines.push(`- Total Discovered URLs: ${report.crawlBudget.totalDiscovered}`);
  lines.push(`- Blocked URLs (overall): ${report.crawlBudget.blocked}`);
  lines.push(`- Percent Blocked: ${report.crawlBudget.percentBlocked}%`);
  lines.push(`- Crawl Efficiency: ${report.crawlBudget.efficiency}%`);
  lines.push('');

  lines.push('## Priority Actions');
  for (const priority of priorities) {
    lines.push(`- **${priority.priority} – ${priority.area} (Impact Score ${priority.impactScore}/10):** ${priority.summary}`);
    lines.push(`  - ${priority.rationale}`);
  }
  lines.push('');

  lines.push('---');
  lines.push('Generated automatically by `npm run audit:technical`.');

  return lines.join('\n');
}

(async () => {
  console.log(`Running technical audit for ${TARGET_URL}...`);

  const [desktopResult, mobileResult] = await Promise.all([
    runLighthouse(TARGET_URL, 'desktop'),
    runLighthouse(TARGET_URL, 'mobile'),
  ]);

  const coreResults = {
    desktop: desktopResult.error ? null : lighthouseSummary(desktopResult.lhr),
    mobile: mobileResult.error ? null : lighthouseSummary(mobileResult.lhr),
  };

  if (desktopResult.error) {
    console.warn(desktopResult.error);
  }
  if (mobileResult.error) {
    console.warn(mobileResult.error);
  }

  const htmlFiles = collectHtmlFiles(REPO_ROOT);
  const htmlInsights = htmlFiles.map((file) => analyzeHtmlFile(file, TARGET_URL));
  const indexingSummary = summarizeHtmlInsights(htmlInsights);

  const { disallow, crawlDelay } = parseRobots(REPO_ROOT);
  if (crawlDelay) {
    console.log(`Crawl-delay directive detected: ${crawlDelay}s`);
  }
  const sitemapSummary = await evaluateSitemap(REPO_ROOT, TARGET_URL, disallow);
  const crawlBudgetSummary = computeCrawlBudget(indexingSummary, sitemapSummary);

  const report = createReport(coreResults, indexingSummary, sitemapSummary, crawlBudgetSummary);
  report.robots = { disallow, crawlDelay };

  const priorities = buildPriorityList(report);
  report.priorities = priorities;

  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR);
  }

  const jsonPath = path.join(REPORT_DIR, 'technical-audit.json');
  const markdownPath = path.join(REPORT_DIR, 'technical-audit.md');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownPath, reportToMarkdown(report, priorities));

  console.log(`Audit complete. Reports saved to ${path.relative(REPO_ROOT, jsonPath)} and ${path.relative(REPO_ROOT, markdownPath)}.`);
})();
