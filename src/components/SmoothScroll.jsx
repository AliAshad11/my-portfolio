"use client";
import { useEffect } from "react";
import Lenis from "lenis";

const NAV_OFFSET = -84;

/* Smooth-scroll to an element, a "#hash" or a pixel value. Works with or without Lenis. */
export function scrollToTarget(target) {
  if (typeof window === "undefined") return;
  let el = target;
  if (typeof target === "string") el = target === "#" || target === "#home" ? 0 : document.querySelector(target);
  if (el === null || el === undefined) return;
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(el, { offset: el === 0 ? 0 : NAV_OFFSET, duration: 1.4 });
  } else {
    const y = typeof el === "number" ? el : el.getBoundingClientRect().top + window.scrollY + NAV_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

export function lockScroll(lock) {
  const lenis = typeof window !== "undefined" ? window.__lenis : null;
  if (lock) {
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
  } else {
    lenis?.start();
    document.documentElement.style.overflow = "";
  }
}

/* Buttery inertia scrolling for the whole page + smooth "#section" links. */
export default function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduce ? null : new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
    window.__lenis = lenis;

    let raf = 0;
    const loop = (t) => {
      lenis?.raf(t);
      raf = requestAnimationFrame(loop);
    };
    if (lenis) raf = requestAnimationFrame(loop);

    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = e.target.closest?.('a[href^="#"], a[href^="/#"]');
      if (!a) return;
      const hash = a.getAttribute("href").replace(/^\//, "");
      if (hash !== "#" && !document.querySelector(hash)) return;
      e.preventDefault();
      scrollToTarget(hash);
      history.replaceState(null, "", hash === "#" || hash === "#home" ? window.location.pathname : hash);
    };
    document.addEventListener("click", onClick);

    let t;
    if (window.location.hash) t = setTimeout(() => scrollToTarget(window.location.hash), 350);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis?.destroy();
      window.__lenis = null;
    };
  }, []);

  return null;
}
