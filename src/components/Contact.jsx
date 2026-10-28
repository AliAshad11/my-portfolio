import { Mail, MessageCircle, MapPin, Clock } from "lucide-react";
import Reveal from "./Reveal";
import ContactForm from "./ContactForm";
import SocialIcons from "./SocialIcons";
import { site } from "@/data/site";

export default function Contact() {
  const cards = [
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    site.whatsapp && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: site.whatsappDisplay || site.whatsapp,
      href: `https://wa.me/${site.whatsapp}`,
      external: true,
    },
    { icon: MapPin, label: "Based in · remote OK", value: site.location },
    { icon: Clock, label: "Response time", value: "Within 24 hours" },
  ].filter(Boolean);

  return (
    <section id="contact" className="section contact-section">
      <div className="container">
        <div className="contact-shell">
          <Reveal className="contact-info">
            <span className="section-tag"><i /> Contact</span>
            <h2 className="section-title">
              Let&apos;s build something <span className="grad-text">great</span> together
            </h2>
            <p className="section-sub">
              Hiring for a full-stack role, or have a project in mind? Send a message and I&apos;ll get back to you
              within 24 hours.
            </p>

            <div className="contact-cards">
              {cards.map(({ icon: Icon, label, value, href, external }) => {
                const inner = (
                  <>
                    <span className="meta-icon"><Icon size={18} /></span>
                    <span className="cc-text">
                      <small>{label}</small>
                      <b>{value}</b>
                    </span>
                  </>
                );
                return href ? (
                  <a key={label} href={href} className="contact-card is-link"
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {inner}
                  </a>
                ) : (
                  <div key={label} className="contact-card">{inner}</div>
                );
              })}
            </div>

            <div className="contact-socials">
              <span>Find me on</span>
              <SocialIcons variant="row" />
            </div>
          </Reveal>

          <Reveal delay={0.12} className="contact-form-wrap">
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
