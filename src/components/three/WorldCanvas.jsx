"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

/* Fixed, full-screen 3D world behind every section.
   Replaces the old BackgroundCanvas + HeroSceneCanvas (one WebGL context = smoother). */
const World = dynamic(() => import("./World"), { ssr: false });

const MQ = "(max-width: 960px)";
const subscribe = (cb) => {
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getSnapshot = () => window.matchMedia(MQ).matches;
const getServerSnapshot = () => false;

export default function WorldCanvas() {
  const pointer = useRef({ x: 0, y: 0, active: false });
  const mobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ready, setReady] = useState(false);

  // The 3D world is the heaviest part of the site (~190 KB of 3D code + constant GPU work).
  // It only starts AFTER the page has fully loaded and the browser is idle, and it is
  // skipped completely on phones, low-power devices and "data saver" connections,
  // which keep the lightweight CSS background instead.
  useEffect(() => {
    const nav = navigator;
    const small = window.matchMedia("(max-width: 900px)").matches;
    const weak = (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) || (nav.deviceMemory && nav.deviceMemory < 4);
    const saveData = nav.connection && (nav.connection.saveData || /2g/.test(nav.connection.effectiveType || ""));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (small || weak || saveData || reduce) return;

    let idleId, t;
    const start = () => {
      t = setTimeout(() => {
        idleId = "requestIdleCallback" in window
          ? window.requestIdleCallback(() => setReady(true), { timeout: 2000 })
          : setTimeout(() => setReady(true), 300);
      }, 800);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      clearTimeout(t);
      if ("cancelIdleCallback" in window && idleId) window.cancelIdleCallback(idleId);
      else clearTimeout(idleId);
    };
  }, []);

  useEffect(() => {
    const p = pointer.current;
    const move = (e) => {
      if (e.pointerType === "touch") return;
      p.x = (e.clientX / window.innerWidth) * 2 - 1;
      p.y = -((e.clientY / window.innerHeight) * 2 - 1);
      p.active = true;
    };
    const leave = () => (p.active = false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      <div className="world-canvas" aria-hidden="true">
        {ready && <World pointer={pointer} mobile={mobile} />}
      </div>
      <div className="world-vignette" aria-hidden="true" />
    </>
  );
}
