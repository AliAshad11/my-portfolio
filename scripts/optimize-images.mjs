/**
 * Shrinks your images so the site loads fast (same look, much smaller files).
 *
 *   npm i -D sharp
 *   node scripts/optimize-images.mjs
 *
 * - Project screenshots in public/images/projects/*.jpg are re-saved in place
 *   (max 1200px wide, max 2400px tall, quality 72) — usually 60–80% smaller.
 * - Your hero photo is saved as a small .webp next to the original; the script
 *   tells you the one line to change in data/site.js.
 * Safe to run again any time (already-small files are skipped).
 */
import sharp from "sharp";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const kb = (n) => `${Math.round(n / 1024)} KB`;
let before = 0, after = 0;

/* ---- project screenshots ---- */
const dir = path.resolve("public/images/projects");
if (existsSync(dir)) {
  for (const f of (await readdir(dir)).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
    const file = path.join(dir, f);
    const input = await readFile(file);
    const meta = await sharp(input).metadata();
    const isMobile = /-mobile\./i.test(f);
    const maxW = isMobile ? 420 : 1200;
    if (input.length < 90_000 && (meta.width || 0) <= maxW) { console.log(`${f}  already small, skipped`); continue; }
    let img = sharp(input).resize({ width: maxW, withoutEnlargement: true });
    // cap very tall full-page shots
    const scaledH = Math.round(((meta.height || 0) * Math.min(maxW, meta.width || maxW)) / (meta.width || maxW));
    if (scaledH > 2400) img = sharp(await img.toBuffer()).extract({ left: 0, top: 0, width: Math.min(maxW, meta.width), height: 2400 });
    const out = /\.png$/i.test(f)
      ? await img.png({ compressionLevel: 9, palette: true }).toBuffer()
      : await img.jpeg({ quality: 72, mozjpeg: true, progressive: true }).toBuffer();
    if (out.length < input.length) {
      await writeFile(file, out);
      before += input.length; after += out.length;
      console.log(`${f}  ${kb(input.length)} -> ${kb(out.length)}`);
    } else console.log(`${f}  already optimal`);
  }
} else {
  console.log("No public/images/projects folder yet (run download-screenshots.mjs first).");
}

/* ---- hero photo ---- */
const siteFile = ["src/data/site.js", "data/site.js"].map((p) => path.resolve(p)).find(existsSync);
const src = siteFile && (await readFile(siteFile, "utf8")).match(/photo\s*:\s*["'`]([^"'`]+)["'`]/)?.[1];
if (src && !src.endsWith(".webp")) {
  const file = path.resolve("public", src.replace(/^\//, ""));
  if (existsSync(file)) {
    const outRel = src.replace(/\.[a-z]+$/i, ".webp");
    const outFile = path.resolve("public", outRel.replace(/^\//, ""));
    const buf = await sharp(file).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    await writeFile(outFile, buf);
    const orig = (await stat(file)).size;
    before += orig; after += buf.length;
    console.log(`\nPhoto ${src}  ${kb(orig)} -> ${outRel} ${kb(buf.length)}`);
    console.log(`👉 In ${path.relative(process.cwd(), siteFile)} change:\n     photo: "${src}"\n   to:\n     photo: "${outRel}"`);
  }
} else if (src) {
  console.log(`\nPhoto ${src} is already .webp`);
}

if (before) console.log(`\nTotal: ${kb(before)} -> ${kb(after)} (saved ${Math.round((1 - after / before) * 100)}%)`);
