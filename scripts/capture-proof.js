const { chromium } = require('playwright');
(async()=>{
  const ts = process.env.TS;
  const base = 'http://127.0.0.1:8787/haro/mission-control.html';
  const browser = await chromium.launch({ headless: true, args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1720, height: 980 } });
  await page.goto(base, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `public/proofs/${ts}-full-command-center.png`, fullPage: true });
  await page.click('[data-tab="command"]');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `public/proofs/${ts}-ops-cockpit-section.png`, fullPage: false });
  await browser.close();
})();
