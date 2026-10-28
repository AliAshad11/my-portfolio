"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, Info, MapPin } from "lucide-react";
import ProjectShot from "./ProjectShot";
import ProjectModal from "./ProjectModal";
import { projects, categories } from "@/data/projects";

const AUTOPLAY_MS = 5200;
const VISIBLE = 2; // cards shown on each side of the active one

/* 3D coverflow slider.
   - Active card: click the screenshot or "Visit site" -> opens the live website (new tab)
   - Any card: "Details" -> opens the project modal instantly
   - Side cards: click anywhere else on them -> they glide to the centre
   - Drag / swipe, arrow keys, dots and autoplay (pauses on hover, in modal, off-screen) */
export default function ProjectsSlider() {
  const [filter, setFilter] = useState("All");
  const list = useMemo(() => (filter === "All" ? projects : projects.filter((p) => p.category === filter)), [filter]);
  const len = list.length;

  const [active, setActive] = useState(0);
  const [modal, setModal] = useState(null); // project slug
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const stage = useRef(null);
  const drag = useRef({ x: 0, y: 0, dx: 0, down: false, moved: false });

  const go = useCallback((n) => len && setActive((a) => (((a + n) % len) + len) % len), [len]);
  const goTo = (i) => setActive(i);

  // reset to first card when the filter changes
  const pickFilter = (c) => {
    setFilter(c);
    setActive(0);
  };

  // autoplay
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused || modal || !inView || len < 2) return;
    const id = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, modal, inView, len, go, active]);

  // only autoplay while the slider is on screen
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ---- drag / swipe (a drag never counts as a click) ---- */
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, down: true, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.down) return;
    d.dx = e.clientX - d.x;
    if (Math.abs(d.dx) > 8 && Math.abs(d.dx) > Math.abs(e.clientY - d.y)) d.moved = true;
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    if (d.moved && Math.abs(d.dx) > 50) go(d.dx < 0 ? 1 : -1);
    // let the click event see "moved", then reset
    setTimeout(() => (drag.current.moved = false), 0);
  };
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  };

  const current = list[active];
  const modalIndex = modal ? projects.findIndex((p) => p.slug === modal) : -1;

  return (
    <>
      <div className="filters" role="tablist" aria-label="Filter projects">
        {categories.map((c) => {
          const count = c === "All" ? projects.length : projects.filter((p) => p.category === c).length;
          return (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              className={`filter ${filter === c ? "active" : ""}`}
              onClick={() => pickFilter(c)}
            >
              {filter === c && <motion.span layoutId="filter-pill" className="filter-pill" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className="filter-text">{c} <em>{count}</em></span>
            </button>
          );
        })}
      </div>

      <div
        ref={stage}
        className="slider-stage"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Projects"
        onKeyDown={onKeyDown}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        <div className="slider-track">
          {list.map((p, i) => {
            let off = i - active;
            if (off > len / 2) off -= len;
            if (off < -len / 2) off += len;
            const abs = Math.abs(off);
            const isActive = off === 0;
            const hidden = abs > VISIBLE;
            return (
              <article
                key={p.slug}
                className={`slide ${isActive ? "is-active" : ""} ${hidden ? "is-hidden" : ""}`}
                style={{ "--off": off, "--abs": abs, "--hue": p.hue, zIndex: 20 - abs }}
                aria-hidden={hidden}
                aria-label={`${p.title}${isActive ? " (current)" : ""}`}
              >
                {/* side cards: one click brings them to the centre */}
                {!isActive && !hidden && (
                  <button className="slide-cover" onClick={() => goTo(i)} aria-label={`Show ${p.title}`} tabIndex={-1} />
                )}

                <div className="slide-card">
                  <a
                    className="browser slide-browser"
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={isActive ? 0 : -1}
                    aria-label={`Open ${p.title} live website`}
                  >
                    <div className="browser-bar">
                      <i /><i /><i />
                      <span>{p.domain}</span>
                    </div>
                    <div className="browser-view">
                      {abs <= VISIBLE + 1 && (
                        <ProjectShot
                          src={p.images?.desktop}
                          url={p.url}
                          title={p.title}
                          domain={p.domain}
                          alt={`${p.title} website`}
                          className="shot"
                          eager={abs <= 1}
                        />
                      )}
                      <div className="browser-glare" />
                      <span className="visit-hint"><ArrowUpRight size={16} /> Visit live site</span>
                    </div>
                  </a>

                  <div className="slide-body">
                    <div className="project-meta">
                      <span className="project-cat">{p.category}</span>
                      {p.location && (
                        <span className="project-loc"><MapPin size={12} /> {p.location}</span>
                      )}
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.summary}</p>
                    <div className="slide-actions">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        tabIndex={hidden ? -1 : 0}
                      >
                        Visit site <ArrowUpRight size={16} />
                      </a>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setModal(p.slug)}
                        tabIndex={hidden ? -1 : 0}
                      >
                        <Info size={16} /> Details
                      </button>
                    </div>
                  </div>
                </div>

                <span className="project-index">{String(projects.indexOf(p) + 1).padStart(2, "0")}</span>
              </article>
            );
          })}
        </div>

        <button className="slider-arrow prev" onClick={() => go(-1)} aria-label="Previous project"><ChevronLeft /></button>
        <button className="slider-arrow next" onClick={() => go(1)} aria-label="Next project"><ChevronRight /></button>
      </div>

      <div className="slider-foot">
        <span className="slider-count">
          <b className="grad-text">{String(active + 1).padStart(2, "0")}</b> / {String(len).padStart(2, "0")}
        </span>
        <div className="slider-dots" role="tablist" aria-label="Choose project">
          {list.map((p, i) => (
            <button
              key={p.slug}
              role="tab"
              aria-selected={i === active}
              aria-label={p.title}
              className={`dot ${i === active ? "active" : ""}`}
              onClick={() => goTo(i)}
            >
              {i === active && !paused && !modal && inView && <i key={active} style={{ animationDuration: `${AUTOPLAY_MS}ms` }} />}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.slug}
              className="slider-stack"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {current.stack?.slice(0, 4).map((s) => <span key={s} className="tag">{s}</span>)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProjectModal
        project={modalIndex >= 0 ? projects[modalIndex] : null}
        onClose={() => setModal(null)}
        onPrev={() => setModal(projects[(modalIndex - 1 + projects.length) % projects.length].slug)}
        onNext={() => setModal(projects[(modalIndex + 1) % projects.length].slug)}
      />
    </>
  );
}
