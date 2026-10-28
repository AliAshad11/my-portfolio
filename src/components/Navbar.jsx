"use client";
import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "./navLinks";


export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // highlight the section that is in the middle of the screen
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <>
      <motion.div className="scroll-progress" style={{ scaleX: bar }} aria-hidden="true" />
      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <a href="#home" className="nav-logo" onClick={() => setOpen(false)}>
          <span className="logo-mark">AA</span>
          <span>Ali <span className="grad-text">Ashad</span></span>
        </a>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={active === l.id ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              {active === l.id && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className="nav-text">{l.label}</span>
            </a>
          ))}
        </nav>

        <a href="#contact" className="btn btn-primary btn-sm nav-cta">Hire me</a>

        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
    </>
  );
}
