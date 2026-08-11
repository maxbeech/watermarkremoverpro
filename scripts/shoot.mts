/**
 * Design-audit screenshotter. Drives the real deployment (or a local server) in
 * a real browser and writes full-page screenshots to .polish-shots/<label>/.
 *
 *   tsx scripts/shoot.mts <baseUrl> <label>
 */
import { chromium, type Page } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'https://markwitness.helm7.com';
const label = process.argv[3] ?? 'before';
const outDir = new URL(`../.polish-shots/${label}/`, import.meta.url).pathname;

const ROUTES: Array<[string, string]> = [
  ['home', '/'],
  ['check', '/check'],
  ['pricing', '/pricing'],
  ['method', '/method'],
  ['limits', '/limits'],
  ['docs', '/docs'],
  ['for-index', '/for'],
  ['for-students', '/for/university-students'],
  ['vs-gptzero', '/vs/gptzero'],
  ['guide-index', '/guide'],
  ['signup', '/signup'],
];

/**
 * Scroll the whole page before capturing.
 *
 * A full-page screenshot does not scroll, so anything revealed by an
 * IntersectionObserver never gets observed and photographs as a blank gap. That
 * is a property of the camera, not of the page, and browsing first is what a
 * visitor does anyway.
 */
async function browse(page: Page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

const SAMPLE = `The committee reviewed the proposal at length before reaching a decision. Several members raised concerns about the timetable, and the chair agreed to circulate a revised schedule ahead of the next meeting. A follow-up note will record the agreed actions and the people responsible for each of them, so that nothing depends on anyone's memory of the discussion.`;

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const [name, path] of ROUTES) {
    const res = await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(500);
    await browse(page);
    await page.screenshot({ path: `${outDir}${name}.png`, fullPage: true });
    console.log(`${name}\t${res?.status()}\t${await page.title()}`);
  }

  // The result state is the screen that actually matters for this product.
  await page.goto(base + '/check', { waitUntil: 'networkidle' });
  const box = page.locator('textarea').first();
  await box.fill(SAMPLE.repeat(3));
  await page.waitForTimeout(400);
  const run = page.getByRole('button', { name: /check|analyse|analyze|run/i }).first();
  if (await run.count()) await run.click();
  await page.waitForTimeout(4000);
  await browse(page);
  await page.screenshot({ path: `${outDir}check-result.png`, fullPage: true });
  console.log('check-result\tcaptured');

  // Mobile home, since half the traffic will see this first.
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(base + '/', { waitUntil: 'networkidle' });
  await m.waitForTimeout(500);
  await browse(m);
  await m.screenshot({ path: `${outDir}home-mobile.png`, fullPage: true });
  console.log('home-mobile\tcaptured');

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
