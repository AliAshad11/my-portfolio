/**
 * Takes real screenshots of every project's live website and saves them into
 * /public/images/projects/  — so the images ship with your site and always load.
 *
 * One-time setup (in your project folder):
 *   npm i -D playwright
 *   npx playwright install chromium
 *
 * Run:
 *   node scripts/capture-screenshots.mjs                 (all projects)
 *   node scripts/capture-screenshots.mjs mst-hire        (one project by slug)
 *
 * Re-run whenever a client website changes.
 */
import { chromium } from "playwright";
import { mkdir, readFile, writeFile, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

/* ---- load the project list (works with src/data or data, ESM or not) ---- */
const candidates = ["src/data/projects.js", "data/projects.js"].map((p) => path.resolve(p));
const dataFile = candidates.find((p) => existsSync(p));
if (!dataFile) {
  console.error("Could not find src/data/projects.js or data/projects.js. Run this from your project folder.");
  process.exit(1);
}
const tmp = path.join(os.tmpdir(), `projects-${Date.now()}.mjs`);
await writeFile(tmp, await readFile(dataFile, "utf8"));
const { projects } = await import(pathToFileURL(tmp).href);
await rm(tmp, { force: true });

const only = process.argv[2];
const list = only ? projects.filter((p) => p.slug === only) : projects;
const pub = path.resolve("public");

/* hide cookie banners, chat bubbles and popups so the shot looks clean */
const HIDE_CSS = `
  [id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], [class*="gdpr" i],
  #CybotCookiebotDialog, .cky-consent-container, .cmplz-cookiebanner, #moove_gdpr_cookie_info_bar,
  iframe[src*="tawk"], iframe[title*="chat" i], [id*="tidio" i], .grecaptcha-badge, #chaty-widget-0,
  [class*="whatsapp" i][class*="float" i], [class*="wa-" i][class*="float" i],
  .elementor-popup-modal, .pum-overlay, [class*="newsletter-popup" i] { display: none !important; }
  html, body { overflow: visible !important; }
`;

const UA_MOBILE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

async function shoot(browser, url, out, mobile) {
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA_MOBILE }
      : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
  );
  const page = await ctx.newPage();
  try {
    let res;
    try {
      res = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    } catch {
      res = await page.goto(url, { waitUntil: "load", timeout: 90000 });
    }
    if (res && res.status() >= 400) throw new Error(`site answered HTTP ${res.status()}`);

    await page.addStyleTag({ content: HIDE_CSS });
    // scroll through the page so lazy images and scroll animations load
    await page.evaluate(async () => {
      const step = Math.max(400, window.innerHeight * 0.8);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 180));
      }
      window.scrollTo(0, 0);
    });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(2000);

    // guard against error pages
    const title = (await page.title()).toLowerCase();
    if (/404|not found|error|forbidden|suspended|maintenance/.test(title)) throw new Error(`page title looks like an error: "${title}"`);

    await mkdir(path.dirname(out), { recursive: true });
    const full = await page.evaluate(() => document.documentElement.scrollHeight);
    const w = mobile ? 390 : 1440;
    const h = Math.min(full, mobile ? 2600 : 4800); // tall shot, capped, so the details popup can scroll it
    const type = /\.png$/i.test(out) ? "png" : "jpeg";
    await page.screenshot({
      path: out, type, ...(type === "jpeg" ? { quality: 80 } : {}),
      fullPage: true, clip: { x: 0, y: 0, width: w, height: h },
    });
    const kb = Math.round((await stat(out)).size / 1024);
    return kb;
  } finally {
    await ctx.close();
  }
}

const browser = await chromium.launch();
let ok = 0, failed = [];
for (const p of list) {
  for (const [key, mobile] of [["desktop", false], ["mobile", true]]) {
    const rel = p.images?.[key];
    if (!rel) continue;
    const out = path.join(pub, rel.replace(/^\//, ""));
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      process.stdout.write(`${p.slug} (${key})${attempt > 1 ? ` retry ${attempt}` : ""} ... `);
      try {
        const kb = await shoot(browser, p.url, out, mobile);
        console.log(`saved ${rel} (${kb} KB)`);
        ok++;
        done = true;
      } catch (e) {
        console.log("failed:", e.message.split("\n")[0]);
      }
    }
    if (!done) failed.push(`${p.slug} (${key})`);
  }
}
await browser.close();

console.log(`\nDone: ${ok} screenshots saved to public/images/projects/`);
if (failed.length) {
  console.log("Could not capture:", failed.join(", "));
  console.log("Those cards will use a live screenshot instead. Re-run later for just one:  node scripts/capture-screenshots.mjs <slug>");
}
