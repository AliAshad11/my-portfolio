"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Download, MapPin } from "lucide-react";
import HeroPortrait from "./HeroPortrait";
import SocialIcons from "./SocialIcons";
import "./hero3d.css";
import { site } from "@/data/site";
import { asset } from "@/lib/asset";

const words = ["booking platforms", "full-stack web apps", "e-commerce stores", "business websites"];

/* Entrance animations are pure CSS (class "enter"), so the hero is visible and animating
   the instant the HTML arrives, without waiting for JavaScript to download. */
const ease = [0.22, 1, 0.36, 1];

export default function Hero() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setW((n) => (n + 1) % words.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="home" className="hero hero3d">
      {/* hero-only background: aurora glow, perspective grid, spotlight */}
      <div className="hero-bg" aria-hidden="true">
        <span className="aurora a1" />
        <span className="aurora a2" />
        <span className="aurora a3" />
        <span className="hero-grid-floor" />
        <span className="hero-spot" />
      </div>

      {/* vertical social bar (desktop) */}
      <aside className="social-rail enter-left" aria-label="Social links">
        <span className="rail-line" />
        <SocialIcons variant="rail" />
        <span className="rail-line" />
      </aside>

      <div className="container hero-grid">
        <div className="hero-content">
          <div className="badge enter" style={{ "--d": "0.05s" }}>
            <i /> Open to full-time roles &amp; freelance work
          </div>

          <p className="hero-hi enter" style={{ "--d": "0.12s" }}>Hi, I&apos;m</p>

          <h1 className="hero-title enter-tilt" style={{ "--d": "0.12s" }}>
            Ali <span className="grad-text">Ashad</span>
          </h1>

          <h2 className="hero-role enter" style={{ "--d": "0.26s" }}>
            Full Stack Web Developer
          </h2>

          <div className="hero-rotator enter" style={{ "--d": "0.33s" }}>
            <span>I build</span>
            <span className="rotator-window">
              <span className="rotator-sizer" aria-hidden="true">full-stack web apps</span>
              <AnimatePresence initial={false}>
                <motion.span
                  key={words[w]}
                  className="grad-text"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.45, ease }}
                >
                  {words[w]}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          <p className="hero-text enter" style={{ "--d": "0.40s" }}>
            I design and build complete web products: fast React and Next.js front ends, Laravel and
            Node.js back ends, databases, booking systems, e-commerce and more.
          </p>

          <div className="hero-actions enter" style={{ "--d": "0.47s" }}>
            <a href="#projects" className="btn btn-primary">
              View Projects <ArrowRight size={18} />
            </a>
            <a href="#contact" className="btn btn-ghost">Contact Me</a>
            <a href={asset(site.resume)} download className="btn btn-ghost">
              <Download size={18} /> Resume
            </a>
          </div>

          {/* social icons in a row on tablet / mobile (the side bar is hidden there) */}
          <div className="hero-socials-mobile enter" style={{ "--d": "0.54s" }}>
            <SocialIcons variant="row" />
          </div>

          <div className="stats enter" style={{ "--d": "0.54s" }}>
            <div className="stat"><b className="grad-text">10+</b><span>Live client sites</span></div>
            <div className="stat"><b className="grad-text">5</b><span>Countries served</span></div>
            <div className="stat"><b className="grad-text">2024</b><span>Building since</span></div>
          </div>

          <div className="hero-meta enter" style={{ "--d": "0.61s" }}>
            <MapPin size={16} /> {site.location} · Available worldwide (remote)
          </div>
        </div>

        <div className="hero-visual">
          <HeroPortrait />
        </div>
      </div>

      <a href="#services" className="scroll-hint" aria-label="Scroll to services">
        <span className="mouse"><i /></span>
        SCROLL
      </a>
    </section>
  );
}
