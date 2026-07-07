'use strict';
// Headless-browser smoke test — runs the client-side JS for real, which
// curl-only TEST_CMD checks cannot: tab switching, page load JS errors,
// console errors. See CLAUDE.md's smoke-test requirement.

const puppeteer = require('puppeteer-core');

const BASE_URL = process.argv[2] || process.env.SMOKE_BASE_URL || 'http://localhost:19999';
const EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

const failures = [];

function fail(msg) {
  failures.push(msg);
  console.error(`FAIL: ${msg}`);
}

async function withErrorCapture(page, label, fn) {
  const pageErrors = [];
  const consoleErrors = [];
  const onPageError = err => pageErrors.push(err.message || String(err));
  const onConsole = msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  try {
    await fn();
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
  }
  for (const err of pageErrors) fail(`${label}: uncaught JS error — ${err}`);
  for (const err of consoleErrors) fail(`${label}: console error — ${err}`);
}

async function checkTab(page, tabName) {
  await withErrorCapture(page, `tab click "${tabName}"`, async () => {
    await page.click(`[data-tab="${tabName}"]`);
    // renderListings/renderOrders fetch data async after the click.
    await new Promise(r => setTimeout(r, 300));
  });

  const btnActive = await page.$eval(
    `[data-tab="${tabName}"]`,
    el => el.classList.contains('active')
  );
  if (!btnActive) fail(`tab "${tabName}": button did not get .active class`);

  const panelVisible = await page.$eval(
    `#tab-${tabName}`,
    el => !el.hidden
  ).catch(() => null);
  if (panelVisible === null) {
    fail(`tab "${tabName}": #tab-${tabName} panel not found`);
  } else if (!panelVisible) {
    fail(`tab "${tabName}": panel is still hidden after click`);
  }
}

async function checkPageLoads(page, path) {
  let response;
  await withErrorCapture(page, `load ${path}`, async () => {
    response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0', timeout: 15000 });
  });
  if (!response || response.status() !== 200) {
    fail(`load ${path}: expected status 200, got ${response ? response.status() : 'no response'}`);
  }
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 15000 });
  await page.type('#email', 'demo@example.com');
  await page.type('#password', 'password123');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    await login(page);

    await withErrorCapture(page, 'load /', async () => {
      const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0', timeout: 15000 });
      if (!response || response.status() !== 200) {
        fail(`load /: expected status 200, got ${response ? response.status() : 'no response'}`);
      }
    });

    await page.waitForSelector('.tabs-container', { timeout: 5000 }).catch(() => {
      fail('load /: .tabs-container not found — dashboard did not render');
    });

    for (const tab of ['listings', 'orders', 'analytics']) {
      await checkTab(page, tab);
    }

    await checkPageLoads(page, '/about');
    await checkPageLoads(page, '/settings');
  } finally {
    await browser.close();
  }

  if (failures.length > 0) {
    console.error(`\nsmoke-test: ${failures.length} failure(s):`);
    failures.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }

  console.log('smoke-test: ok');
  process.exit(0);
}

main().catch(err => {
  console.error(`smoke-test: crashed — ${err.stack || err}`);
  process.exit(1);
});
