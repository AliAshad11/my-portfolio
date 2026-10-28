# Portfolio update — one-page, full 3D

## 1. Install the one new package
```bash
npm i lenis
```
(three, @react-three/fiber, @react-three/drei, framer-motion, lucide-react are already in your project.)

## 2. Copy the files
Copy everything from this folder into your project, replacing the old files:

```
app/layout.jsx            (new: smooth scroll + 3D world + navbar + footer)
app/page.jsx              (new: all sections on one page)
app/globals.css
components/*.jsx, hero3d.css, navLinks.js
components/three/World.jsx, WorldCanvas.jsx
scripts/capture-screenshots.mjs
```

`app/layout.jsx` loads Inter + Space Grotesk via `next/font`. If you already load your own fonts,
keep yours and just copy the `<SmoothScroll />`, `<WorldCanvas />`, `<Navbar />` and `<Footer />` lines.

## 3. Delete what is no longer used
The site is now one page, so remove:
```
app/about/   app/projects/   app/contact/        (old separate pages)
components/three/Background.jsx, BackgroundCanvas.jsx, HeroScene.jsx, HeroSceneCanvas.jsx
components/ProjectCard.jsx, ProjectsGrid.jsx, ProjectGallery.jsx
```
If any old links point to /projects or /contact, add to `next.config.mjs`:
```js
async redirects() {
  return [
    { source: "/projects/:slug*", destination: "/#projects", permanent: true },
    { source: "/about", destination: "/#services", permanent: true },
    { source: "/contact", destination: "/#contact", permanent: true },
  ];
},
```

## 4. Add your social links to `data/site.js`
Only links that exist are shown (hero rail, contact, footer):
```js
github: "https://github.com/your-username",
linkedin: "https://www.linkedin.com/in/your-profile",
fiverr: "https://www.fiverr.com/your-username",   // optional
```
WhatsApp and email use the `whatsapp` and `email` fields you already have.

## 5. Real screenshots for every project (no error pages)
The slider shows the local file at `images.desktop` / `images.mobile` first.
Generate clean screenshots of every live site once:
```bash
npm i -D playwright
npx playwright install chromium
node scripts/capture-screenshots.mjs              # all projects
node scripts/capture-screenshots.mjs <slug>       # just one
```
It hides cookie banners and chat widgets, scrolls to load lazy images, and saves to the exact
paths in `data/projects.js`. If a file is ever missing, the site falls back to a live screenshot
(and waits for the real image instead of showing the "generating" placeholder), then to a branded card.
Never an error page.

## Optional project fields the details modal uses
`description` (falls back to `summary`), `features` (array), `challenge`, `results` (array),
`gallery` (image URLs; broken ones are hidden automatically).
