"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Globe2, Layers, MapPin, X } from "lucide-react";
import ProjectShot from "./ProjectShot";
import { lockScroll } from "./SmoothScroll";

/* Extra images from the live site; any that fail to load are simply removed. */
function SiteImages({ project: p }) {
  const [broken, setBroken] = useState({});
  const imgs = (p.gallery || []).filter((src) => !broken[src]).slice(0, 6);
  if (!imgs.length) return null;
  return (
    <div className="pm-block">
      <h4>From the live site</h4>
      <div className="pm-gallery">
        {imgs.map((src) => (
          <a key={src} href={p.url} target="_blank" rel="noopener noreferrer" className="pm-thumb">
            <img src={src} alt={`${p.title} screenshot`} loading="lazy" onError={() => setBroken((b) => ({ ...b, [src]: true }))} />
          </a>
        ))}
      </div>
    </div>
  );
}

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export default function ProjectModal({ project: p, onClose, onPrev, onNext }) {
  useEffect(() => {
    if (!p) return;
    lockScroll(true);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [p, onClose, onNext, onPrev]);

  // tolerant of different field names in data/projects.js
  const about = p && (p.description || p.overview || p.about || p.summary);
  const features = p ? asList(p.features || p.highlights) : [];
  const challenge = p && (p.challenge?.text || p.challenge);
  const results = p ? asList(p.results || p.outcomes) : [];

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {p && (
        <motion.div
          className="pm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            key={p.slug}
            className="pm-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${p.title} details`}
            style={{ "--hue": p.hue, transformPerspective: 1400 }}
            initial={{ opacity: 0, y: 60, rotateX: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, rotateX: 8, scale: 0.96 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            <header className="pm-head">
              <div>
                <span className="project-cat">{p.category}</span>
                <h3>{p.title}</h3>
                <div className="pm-meta">
                  {p.location && <span><MapPin size={14} /> {p.location}</span>}
                  {p.domain && <span><Globe2 size={14} /> {p.domain}</span>}
                </div>
              </div>
              <div className="pm-head-actions">
                <button className="pm-icon" onClick={onPrev} aria-label="Previous project"><ChevronLeft size={20} /></button>
                <button className="pm-icon" onClick={onNext} aria-label="Next project"><ChevronRight size={20} /></button>
                <button className="pm-icon" onClick={onClose} aria-label="Close"><X size={20} /></button>
              </div>
            </header>

            <div className="pm-body">
              <div className="pm-visual">
                <div className="browser pm-browser">
                  <div className="browser-bar"><i /><i /><i /><span>{p.domain}</span></div>
                  <a className="browser-view" href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.title}`}>
                    <ProjectShot src={p.images?.desktop} url={p.url} title={p.title} domain={p.domain}
                      alt={`${p.title} desktop`} className="shot" eager />
                    <span className="visit-hint"><ArrowUpRight size={16} /> Visit live site</span>
                  </a>
                </div>
                <div className="pm-phone">
                  <div className="phone">
                    <span className="phone-notch" />
                    <div className="phone-screen">
                      <ProjectShot src={p.images?.mobile} url={p.url} mobile title={p.title} domain={p.domain}
                        alt={`${p.title} mobile`} className="shot" eager />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pm-info">
                {about && <p className="pm-lead">{about}</p>}

                {challenge && typeof challenge === "string" && (
                  <div className="pm-block">
                    <h4>The challenge</h4>
                    <p>{challenge}</p>
                  </div>
                )}

                {features.length > 0 && (
                  <div className="pm-block">
                    <h4>What I built</h4>
                    <ul className="pm-list">
                      {features.map((f) => (
                        <li key={typeof f === "string" ? f : f.title}><span><Check size={13} /></span>{typeof f === "string" ? f : f.title}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.length > 0 && (
                  <div className="pm-block">
                    <h4>Results</h4>
                    <ul className="pm-list">
                      {results.map((r) => <li key={r}><span><Check size={13} /></span>{r}</li>)}
                    </ul>
                  </div>
                )}

                {p.stack?.length > 0 && (
                  <div className="pm-block">
                    <h4><Layers size={15} /> Tech stack</h4>
                    <div className="tags">{p.stack.map((s) => <span key={s} className="tag">{s}</span>)}</div>
                  </div>
                )}

                <SiteImages project={p} />

                <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary pm-cta">
                  Visit {p.domain || "website"} <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
