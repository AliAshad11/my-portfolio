import { Monitor, Server, ShoppingBag, Database, Terminal, Wrench } from "lucide-react";
import Reveal from "./Reveal";
import TiltCard from "./TiltCard";
import SectionHead from "./SectionHead";

const skills = [
  { icon: Monitor, title: "Front-End", items: ["HTML5", "CSS3", "JavaScript", "React", "Next.js", "Tailwind", "Bootstrap", "Responsive Design"] },
  { icon: Server, title: "Back-End", items: ["PHP", "Laravel", "Blade", "Node.js", "Express.js", "REST APIs"] },
  { icon: Database, title: "Databases", items: ["MySQL", "MongoDB", "SQL"] },
  { icon: ShoppingBag, title: "CMS & E-Commerce", items: ["WordPress", "WooCommerce", "Elementor", "Shopify", "Squarespace", "Wix"] },
  { icon: Terminal, title: "Other Languages", items: ["Python", "Java", "C++"] },
  { icon: Wrench, title: "Tools & Practices", items: ["Git / GitHub", "Debugging", "SEO", "Performance", "Multilingual Sites", "Deployment"] },
];

export default function SkillsSection() {
  return (
    <section id="skills" className="section">
      <div className="container">
        <SectionHead
          tag="Skills"
          title="My full-stack"
          accent="toolkit"
          sub="Everything I use to take a product from interface to database to deployment."
        />

        <div className="skills-grid">
          {skills.map(({ icon: Icon, title, items }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <TiltCard className="skill-card">
                <div className="skill-head">
                  <div className="skill-icon"><Icon size={22} color="#fff" /></div>
                  <h3>{title}</h3>
                </div>
                <div className="tags">
                  {items.map((s) => (
                    <span key={s} className="tag">{s}</span>
                  ))}
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
