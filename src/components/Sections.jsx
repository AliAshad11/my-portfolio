import { Layers, CalendarCheck, ShoppingBag, Gauge, Check } from "lucide-react";
import Reveal from "./Reveal";
import TiltCard from "./TiltCard";
import SectionHead from "./SectionHead";
import { services, processSteps, experience, techMarquee } from "@/data/site";

const icons = { Layers, CalendarCheck, ShoppingBag, Gauge };

/* ---------- Tech marquee ---------- */
export function Marquee() {
  const items = [...techMarquee, ...techMarquee];
  return (
    <div className="marquee" aria-label="Technologies">
      <div className="marquee-track">
        {items.map((t, i) => (
          <span key={i} className="marquee-item">
            <i>✦</i> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Services ---------- */
export function Services() {
  return (
    <section id="services" className="section">
      <div className="container">
        <SectionHead
          tag="What I do"
          title="End-to-end"
          accent="web development"
          sub="One developer for the whole product: interface, server, database and launch."
        />
        <div className="services-grid">
          {services.map((s, i) => {
            const Icon = icons[s.icon];
            return (
              <Reveal key={s.title} delay={i * 0.08}>
                <TiltCard className="service-card">
                  <span className="service-num">0{i + 1}</span>
                  <div className="service-icon"><Icon size={24} /></div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Process ---------- */
export function Process() {
  return (
    <section id="process" className="section">
      <div className="container">
        <SectionHead tag="Process" title="How I" accent="work" sub="A simple, transparent process that keeps projects on time." />
        <div className="process-grid">
          {processSteps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1} className="process-step">
              <span className="process-n grad-text">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Experience ---------- */
export function Experience() {
  return (
    <section id="experience" className="section">
      <div className="container">
        <SectionHead tag="Experience" title="Where I have" accent="worked" />
        <div className="timeline">
          {experience.map((e, i) => (
            <Reveal key={e.role + e.company} delay={i * 0.1} className="tl-item">
              <div className="tl-top">
                <div>
                  <h3>{e.role}</h3>
                  <div className="tl-company">{e.company}</div>
                </div>
                <span className="tl-period">{e.period}</span>
              </div>
              <p>{e.text}</p>
              {e.points?.length > 0 && (
                <ul className="tl-points">
                  {e.points.map((pt) => (
                    <li key={pt}><Check size={15} /> {pt}</li>
                  ))}
                </ul>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
