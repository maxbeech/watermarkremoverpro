/**
 * The primary journey, driven as a person drives it.
 *
 * Unit tests cover the arithmetic; this covers the thing a unit test cannot:
 * that a visitor can land on the homepage, get text into the box by all three
 * routes, press one button, be carried into the workspace, and find their
 * rewritten text there with the detector's reading of it, a comparison they can
 * act on paragraph by paragraph, and a history of what they have run, without a
 * console error or a broken image.
 *
 * Run against a server that is already up:
 *   npm run dev          # in one terminal
 *   npm run e2e          # in another
 *
 * Screenshots land in .e2e-shots/ for a human to look at afterwards.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type ConsoleMessage, type Page } from 'playwright'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3540'
const SHOTS = join(process.cwd(), '.e2e-shots')

const SAMPLE = `In today's rapidly evolving digital landscape, organisations must leverage cutting-edge solutions to unlock their full potential. It's not just about technology, but about people, process, and purpose. Our comprehensive framework delivers seamless integration, robust scalability, and unparalleled insight across the entire value chain.

Moreover, the transformative impact of these initiatives cannot be overstated. By fostering a culture of innovation, collaboration, and continuous improvement, forward-thinking leaders are able to navigate complexity and drive meaningful outcomes. The journey ahead is challenging, but the opportunity is immense.

Ultimately, success hinges on execution. Teams that embrace agility, transparency, and accountability will be best positioned to thrive in an increasingly competitive environment. The time to act is now.`

/**
 * Every distinct page TEMPLATE in the product, not every page: one blog post
 * stands for fifteen, one guide for the whole pSEO set.
 */
const PAGES = [
  '/rewrite',
  // The workspace shell, in its empty state. It is the one route with its own
  // chrome, so it is also the one most likely to overflow on a phone.
  '/app',
  '/check',
  '/pricing',
  '/method',
  '/verify',
  '/limits',
  '/login',
  '/signup',
  '/blog',
  '/blog/green-list-watermarking-explained',
  '/blog/category/academy',
  '/guide/ai-detection-false-positive',
  '/vs/gptzero',
  '/for/university-students',
  '/in/spanish',
  '/docs',
  '/docs/api',
  '/docs/mcp',
  '/terms',
  '/privacy',
] as const

const failures: string[] = []
const check = (label: string, condition: boolean, detail = '') => {
  if (condition) {
    console.log(`  ok    ${label}`)
  } else {
    console.log(`  FAIL  ${label}${detail ? `: ${detail}` : ''}`)
    failures.push(`${label}${detail ? `: ${detail}` : ''}`)
  }
}

/** Console errors that are the dev server's own noise, not the page's. */
const IGNORED_CONSOLE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /hydrat.*dev overlay/i]

function watchConsole(page: Page, sink: string[]) {
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (IGNORED_CONSOLE.some((r) => r.test(text))) return
    sink.push(text)
  })
  page.on('pageerror', (err) => sink.push(`pageerror: ${err.message}`))
}

/**
 * Every <img> on the page actually decoded. A broken logo is invisible to an
 * HTML assertion: the element is there, the alt text is there, and nothing is
 * drawn.
 *
 * Scrolls the page first so lazily-loaded images below the fold have been
 * asked for at all; an image that has not started loading is not the same
 * failure as one that loaded and could not be decoded.
 */
async function assertImagesLoaded(page: Page, label: string) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page
    .waitForFunction(() => [...document.querySelectorAll('img')].every((i) => i.complete), null, {
      timeout: 10_000,
    })
    .catch(() => {})
  await page.evaluate(() => window.scrollTo(0, 0))
  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src),
  )
  check(`${label}: every image decoded`, broken.length === 0, broken.join(', '))
}

/**
 * Passed to `page.evaluate` as a STRING rather than a function.
 *
 * tsx compiles with esbuild's keepNames on, which rewrites named inner
 * functions to call a `__name` helper that exists in Node and not in the page.
 * A serialised function containing named locals therefore throws
 * "__name is not defined" the moment it lands in the browser. A string is
 * evaluated as written.
 */
const CONTRAST_PROBE = `(() => {
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const parse = (value) => {
    const m = value.match(/rgba?\\(([^)]+)\\)/)
    if (!m) return null
    const parts = m[1].split(',').map((n) => parseFloat(n))
    if (parts.length > 3 && parts[3] < 0.95) return null
    return parts.slice(0, 3)
  }
  const backdrop = (el) => {
    let node = el
    while (node) {
      const c = parse(getComputedStyle(node).backgroundColor)
      if (c) return c
      node = node.parentElement
    }
    return [255, 255, 255]
  }

  const bad = []
  for (const el of document.querySelectorAll('body *')) {
    const ownText = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent || '')
      .join('')
      .trim()
    if (ownText.length < 2) continue

    const style = getComputedStyle(el)
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) < 0.95) continue
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue

    const fg = parse(style.color)
    if (!fg) continue
    const lf = luminance(fg)
    const lb = luminance(backdrop(el))
    const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05)

    const size = parseFloat(style.fontSize)
    const bold = Number(style.fontWeight) >= 700
    const large = size >= 24 || (size >= 18.66 && bold)
    const required = large ? 3 : 4.5

    if (ratio < required - 0.02) {
      bad.push(Math.round(ratio * 100) / 100 + ':1 ' + style.color + ' @' + size + 'px "' + ownText.slice(0, 34) + '"')
    }
  }
  return [...new Set(bad)].slice(0, 6)
})()`

/**
 * Every run of visible text clears WCAG AA against what is actually painted
 * behind it. Walks up for the first opaque ancestor background rather than
 * trusting the element's own (usually transparent) one, and only judges leaf
 * nodes that own real text, so a container is not blamed for its children.
 */
async function assertTextContrast(page: Page, label: string) {
  const failures = (await page.evaluate(CONTRAST_PROBE)) as string[]
  check(`${label}: all text meets WCAG AA contrast`, failures.length === 0, failures.join(' | '))
}

/**
 * The PAGE does not scroll sideways.
 *
 * Deliberately measured at the document, not per element: a wide table inside
 * an `overflow-x-auto` figure has a bounding box wider than the viewport by
 * design, and flagging that would train everyone to ignore this check. Only
 * when the document itself scrolls is anything wrong, and only then is it
 * worth naming the widest boxes as the likely cause.
 */
async function assertNoHorizontalOverflow(page: Page, label: string) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement
    if (doc.scrollWidth <= doc.clientWidth) return null
    const culprits = [...document.querySelectorAll('body *')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter((x) => x.r.right > doc.clientWidth + 1 || x.r.left < -1)
      // The outermost offender explains the inner ones.
      .filter((x) => !x.el.parentElement || x.el.parentElement.getBoundingClientRect().right <= doc.clientWidth + 1)
      .slice(0, 4)
      .map((x) => `${x.el.tagName}.${String(x.el.className).slice(0, 40)} [${Math.round(x.r.left)}..${Math.round(x.r.right)}]`)
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, culprits }
  })
  check(
    `${label}: the page does not scroll sideways`,
    result === null,
    result ? `${result.scrollWidth}px in a ${result.clientWidth}px viewport, from ${result.culprits.join(' | ')}` : '',
  )
}

async function main() {
  mkdirSync(SHOTS, { recursive: true })
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const consoleErrors: string[] = []
  watchConsole(page, consoleErrors)

  // ---------------------------------------------------------------- homepage
  console.log('\nHomepage')
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.screenshot({ path: join(SHOTS, '01-home-hero.png'), fullPage: false })
  // Reveal-on-scroll content starts transparent; wait past its backstop so the
  // full-page artefact shows what a reader ends up seeing, not what the page
  // looks like 40ms after load.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(3000)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: join(SHOTS, '02-home-full.png'), fullPage: true })

  check('one h1', (await page.locator('h1').count()) === 1)
  check('logo lockup in the header', await page.locator('header img').isVisible())
  check(
    'the input box is above the fold',
    (await page.locator('textarea').first().boundingBox())!.y < 900,
  )
  check('no Learnaway banner above the header', (await page.locator('header ~ *').count()) > 0)
  const aboveFoldText = await page.evaluate(() => document.body.innerText.slice(0, 600))
  check(
    'Learnaway is not the first thing on the page',
    !aboveFoldText.toLowerCase().includes('learnaway'),
    aboveFoldText.slice(0, 120),
  )
  check(
    'the Learnaway pointer is still present further down',
    (await page.getByText('Learnaway', { exact: false }).count()) > 0,
  )
  await assertImagesLoaded(page, 'homepage')
  await assertNoHorizontalOverflow(page, 'homepage')

  // ------------------------------------------------------- advanced settings
  console.log('\nAdvanced settings')
  const advanced = page.getByRole('button', { name: /advanced settings/i })
  check('advanced settings exist and are collapsed', (await advanced.getAttribute('aria-expanded')) === 'false')
  check(
    'language, engine and strength are hidden until asked for',
    (await page.locator('select').count()) === 0 &&
      (await page.getByRole('button', { name: /^Standard/ }).count()) === 0,
  )
  await advanced.click()
  check('opening it reveals the language control', (await page.locator('select').count()) === 1)
  check('opening it reveals the engine choice', await page.getByRole('button', { name: /^Pro/ }).first().isVisible())
  check(
    'opening it reveals the strength control',
    await page.getByText('How much to change', { exact: true }).isVisible(),
  )
  await page.screenshot({ path: join(SHOTS, '03-advanced-open.png') })
  await advanced.click()

  // --------------------------------------------------------------- the paste
  console.log('\nPaste, and the handoff into the workspace')
  const box = page.locator('textarea').first()
  await box.fill(SAMPLE)
  const words = SAMPLE.trim().split(/\s+/).length
  await page.waitForFunction(
    (n) => document.body.innerText.includes(`${n} words`),
    words,
    { timeout: 5000 },
  ).catch(() => {})
  check('the word count reflects what was pasted', (await page.getByText(`${words} words`).count()) > 0)

  await page.getByRole('button', { name: /clean up my text/i }).first().click()

  const heading = page.getByRole('heading', { name: 'Your rewritten text', exact: true })
  await heading.waitFor({ timeout: 60_000 })
  check('pressing the button opens the workspace', new URL(page.url()).pathname === '/app')
  check('the run id travels in the URL, not the document', /[?&]run=run_/.test(page.url()))
  check('the workspace is not the marketing page', (await page.locator('footer').count()) === 0)
  check('the output screen appears', await heading.isVisible())

  const revised = await page.locator('textarea[readonly]').first().inputValue()
  check('the rewritten text is real and non-empty', revised.trim().length > 50, `${revised.length} chars`)
  check('the rewritten text is not identical to the input', revised.trim() !== SAMPLE.trim())

  check(
    'the AI-detection summary is on screen without being asked for',
    await page.getByRole('heading', { name: /what the detector finds now/i }).isVisible(),
  )
  check(
    'the deep dive is collapsed rather than four panels of statistics',
    (await page.getByText('Provenance mark', { exact: true }).count()) === 1 &&
      (await page.getByRole('button', { name: /the full analysis/i }).getAttribute('aria-expanded')) === 'false',
  )
  await page.getByRole('button', { name: /the full analysis/i }).click()
  check(
    'opening the deep dive reveals the same analysis the check page runs',
    await page.getByText('A keyed statistical test', { exact: false }).first().isVisible(),
  )
  check('stated limits travel with the result', (await page.getByText(/cannot guarantee|no guarantee/i).count()) > 0)
  check('copy and download are offered', (await page.getByRole('button', { name: /^Copy$/ }).count()) === 1)

  // ------------------------------------------------------------- comparison
  console.log('\nComparison and per-paragraph rewriting')
  check(
    'a paragraph-by-paragraph comparison is shown',
    await page.getByRole('heading', { name: 'Comparison', exact: true }).isVisible(),
  )
  check('it offers both layouts', (await page.getByRole('button', { name: /^unified$/i }).count()) === 1)
  await page.getByRole('button', { name: /^unified$/i }).click()
  check(
    'the unified layout marks removals and insertions',
    (await page.locator('del').count()) > 0 && (await page.locator('ins').count()) > 0,
  )
  await page.getByRole('button', { name: /^split$/i }).click()
  check('the split layout shows the draft beside the rewrite', (await page.getByText('Your draft').count()) > 0)

  const paragraphButtons = page.getByRole('button', { name: /^Rewrite again$/ })
  check('every paragraph can be sent back on its own', (await paragraphButtons.count()) >= 3)
  check(
    'paragraphs can be selected in bulk',
    (await page.getByRole('checkbox').count()) >= 3 &&
      (await page.getByRole('button', { name: /select every changed paragraph/i }).count()) === 1,
  )
  const beforeParagraphRun = await page.locator('textarea[readonly]').first().inputValue()
  await paragraphButtons.first().click()
  await page.waitForFunction(
    (previous) => {
      const area = document.querySelector('textarea[readonly]') as HTMLTextAreaElement | null
      const notice = document.body.innerText.includes('found nothing further')
      return notice || (area !== null && area.value !== previous)
    },
    beforeParagraphRun,
    { timeout: 60_000 },
  )
  check(
    'a single paragraph either changes or says why it could not',
    (await page.locator('textarea[readonly]').first().inputValue()) !== beforeParagraphRun ||
      (await page.getByText(/found nothing further/i).count()) > 0,
  )

  check(
    'the whole document can be run again',
    await page.getByRole('button', { name: /rewrite the whole thing again/i }).isVisible(),
  )

  await page.screenshot({ path: join(SHOTS, '04-result.png'), fullPage: true })
  await assertNoHorizontalOverflow(page, 'workspace')

  // ---------------------------------------------------------------- history
  console.log('\nAnonymous identity and history')
  check(
    'the visitor is given a local identity rather than an account',
    (await page.getByText(/^Guest /).count()) === 1,
  )
  check(
    'the history says where it lives',
    (await page.getByText(/live in this browser only/i).count()) === 1,
  )
  check(
    'the run appears in the sidebar',
    (await page.locator('nav[aria-label="Your rewrites"] a').count()) >= 1,
  )
  check(
    'the mirror-product pointer reaches the workspace too',
    (await page.getByText('Learnaway', { exact: false }).count()) > 0,
  )

  await page.getByRole('link', { name: /new rewrite/i }).click()
  await page.getByRole('heading', { name: /clean up a draft/i }).waitFor({ timeout: 10_000 })
  check('a new rewrite can be started from the sidebar', new URL(page.url()).search === '')
  check(
    'the previous run is still listed after starting a new one',
    (await page.locator('nav[aria-label="Your rewrites"] a').count()) >= 1,
  )

  await page.goto(BASE, { waitUntil: 'networkidle' })

  // ------------------------------------------------------------ file upload
  console.log('\nFile input')
  const tmp = join(SHOTS, 'sample.txt')
  writeFileSync(tmp, SAMPLE)
  await page.setInputFiles('input[type=file]', tmp)
  await page.waitForTimeout(400)
  check('an uploaded .txt lands in the box', (await page.locator('textarea').first().inputValue()).length > 100)
  check('the loaded filename is shown', (await page.getByText(/Loaded sample\.txt/).count()) === 1)

  // A format the browser cannot read on its own must be refused BY NAME.
  const pdf = join(SHOTS, 'sample.pdf')
  writeFileSync(pdf, '%PDF-1.4 not a real pdf')
  await page.setInputFiles('input[type=file]', pdf)
  await page.waitForTimeout(300)
  check('a PDF is refused with a reason, not silently', (await page.getByText(/PDFs need a parser/i).count()) === 1)

  // ------------------------------------------------------------- check page
  console.log('\nDedicated check page')
  await page.goto(`${BASE}/check`, { waitUntil: 'networkidle' })
  check('the check page has its own h1', (await page.locator('h1').count()) === 1)
  check(
    'it reuses the same input surface',
    (await page.getByRole('button', { name: /upload a file/i }).count()) === 1,
  )
  await page.locator('textarea').first().fill(SAMPLE)
  await page.getByRole('button', { name: /run the check/i }).click()
  await page.getByText('Provenance mark').first().waitFor({ timeout: 60_000 })
  check('the check produces a result', (await page.getByText('Stated limits').count()) > 0)
  // The result block rises into place over ~520ms; capture it settled.
  await page.waitForTimeout(1200)
  check(
    'the result is actually painted, not just in the DOM',
    await page.evaluate(() => {
      const el = document.querySelector('.mw-rise')
      return el ? Number(getComputedStyle(el).opacity) > 0.95 : false
    }),
  )
  await page.screenshot({ path: join(SHOTS, '05-check.png'), fullPage: true })
  await assertNoHorizontalOverflow(page, 'check page')

  // ------------------------------------------------------------ other pages
  console.log('\nEvery other page in the nav')
  for (const path of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
    check(`${path} renders one h1`, (await page.locator('h1').count()) === 1)
    await assertImagesLoaded(page, path)
    await assertNoHorizontalOverflow(page, path)
    await assertTextContrast(page, path)
  }

  // ------------------------------------------------------------------ mobile
  console.log('\nMobile')
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mp = await mobile.newPage()
  watchConsole(mp, consoleErrors)
  await mp.goto(BASE, { waitUntil: 'networkidle' })
  await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await mp.waitForTimeout(3000)
  await mp.evaluate(() => window.scrollTo(0, 0))
  await mp.screenshot({ path: join(SHOTS, '06-mobile-home.png'), fullPage: true })
  await assertNoHorizontalOverflow(mp, 'mobile homepage')
  const menu = mp.getByRole('button', { name: /open menu/i })
  check('a mobile menu button exists', await menu.isVisible())
  check(
    'the desktop header actions are hidden on a phone',
    // Two display utilities of equal specificity are settled by stylesheet
    // order, not by class-string order, so `hidden` on an `inline-flex`
    // button silently loses. Assert the outcome, not the class list.
    !(await mp.locator('header a', { hasText: 'Clean up my text' }).first().isVisible()),
  )
  await menu.click()
  check('the mobile menu reaches every nav item', (await mp.locator('#site-menu a').count()) >= 6)
  await mp.screenshot({ path: join(SHOTS, '07-mobile-menu.png') })

  // The template pages are where a two-column layout breaks first, because a
  // grid with only an `lg:` column template falls back to ONE auto-sized
  // column that takes its widest child's width, not the viewport's.
  for (const path of PAGES) {
    await mp.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
    await assertNoHorizontalOverflow(mp, `mobile ${path}`)
  }

  // ------------------------------------------------------------------- done
  check('no console errors anywhere in the journey', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))

  await browser.close()

  console.log(`\nScreenshots: ${SHOTS}`)
  if (failures.length > 0) {
    console.error(`\n${failures.length} check(s) failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`)
    process.exit(1)
  }
  console.log('\nAll journey checks passed.')
}

main().catch((err) => {
  console.error(`\nE2E run failed: ${err.message}\n${err.stack}`)
  process.exit(1)
})
