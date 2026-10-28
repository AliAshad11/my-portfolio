/**
 * EASIEST WAY to get permanent project images — no browser install needed.
 *
 * Downloads a real screenshot of every project website and saves it into
 *   public/images/projects/<slug>-desktop.jpg  and  <slug>-mobile.jpg
 * Those files ship with your site, so the images ALWAYS show, even if a
 * client website is slow or offline.
 *
 * Run from your project folder (Node 18+):
 *   node scripts/download-screenshots.mjs              (all projects)
 *   node scripts/download-screenshots.mjs mst-hire     (one project)
 *   node scripts/download-screenshots.mjs --force      (re-download all)
 */
import { mkdir, readFile, writeFile, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

/* ---- load the project list (src/data or data) ---- */
const dataFile = ["src/data/projects.js", "data/projects.js"].map((p) => path.resolve(p)).find((p) => existsSync(p));
if (!dataFile) {
  console.error("Could not find src/data/projects.js. Run this from your project folder (C:\\projects\\my-portfolio).");
  process.exit(1);
}
const tmp = path.join(os.tmpdir(), `projects-${Date.now()}.mjs`);
await writeFile(tmp, await readFile(dataFile, "utf8"));
const { projects } = await import(pathToFileURL(tmp).href);
await rm(tmp, { force: true });

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.find((a) => !a.startsWith("--"));
const list = only ? projects.filter((p) => p.slug === only) : projects;
if (only && !list.length) {
  console.error(`No project with slug "${only}". Slugs: ${projects.map((p) => p.slug).join(", ")}`);
  process.exit(1);
}

const shotUrl = (url, mobile) =>
  mobile
    ? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?vpw=390&vph=844&w=390&h=844`
    : `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?vpw=1440&vph=900&w=1440&h=900`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* The service first returns a small "generating" GIF placeholder.
   We keep asking until we get the real JPEG (large file). */
async function fetchReal(url, mobile) {
  for (let n = 1; n <= 25; n++) {
    try {
      const res = await fetch(shotUrl(url, mobile), { redirect: "follow", cache: "no-store" });
      const type = res.headers.get("content-type") || "";
      const buf = Buffer.from(await res.arrayBuffer());
      if (res.ok && type.includes("jpeg") && buf.length > 25_000) return buf;
    } catch {
      /* network hiccup: try again */
    }
    process.stdout.write(".");
    await sleep(4000);
  }
  throw new Error("screenshot service did not finish in time");
}

const pub = path.resolve("public");
let ok = 0;
const failed = [];

for (const p of list) {
  for (const [key, mobile] of [["desktop", false], ["mobile", true]]) {
    const rel = p.images?.[key];
    if (!rel) continue;
    const out = path.join(pub, rel.replace(/^\//, ""));
    if (!force && existsSync(out) && (await stat(out)).size > 25_000) {
      console.log(`${p.slug} (${key}) already saved, skipping`);
      ok++;
      continue;
    }
    process.stdout.write(`${p.slug} (${key}) `);
    try {
      const buf = await fetchReal(p.url, mobile);
      await mkdir(path.dirname(out), { recursive: true });
      await writeFile(out, buf);
      console.log(` saved ${rel} (${Math.round(buf.length / 1024)} KB)`);
      ok++;
    } catch (e) {
      console.log(` failed: ${e.message}`);
      failed.push(`${p.slug} (${key})`);
    }
  }
}

console.log(`\nDone: ${ok} images in public/images/projects/`);
if (failed.length) {
  console.log("Not saved yet:", failed.join(", "));
  console.log("Just run the same command again in a minute — the service finishes them in the background.");
}
