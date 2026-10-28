import { Mail, MessageCircle, MapPin, ArrowUpRight, ArrowUp } from "lucide-react";
import { site } from "@/data/site";
import { asset } from "@/lib/asset";
import SocialIcons from "./SocialIcons";
import { NAV_LINKS } from "./navLinks";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="#home" className="nav-logo">
            <span className="logo-mark">AA</span>
            <span>Ali <span className="grad-text">Ashad</span></span>
          </a>
          <p>Full Stack Web Developer building fast, reliable websites and web apps for clients around the world.</p>
          <SocialIcons variant="row" />
        </div>

        <div>
          <h4>Sections</h4>
          {NAV_LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`}>{l.label}</a>
          ))}
        </div>

        <div>
          <h4>Get in touch</h4>
          <a href={`mailto:${site.email}`}><Mail size={15} /> {site.email}</a>
          {site.whatsapp && (
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={15} /> {site.whatsappDisplay || site.whatsapp}
            </a>
          )}
          <span><MapPin size={15} /> {site.location}</span>
        </div>

        <div>
          <h4>Resume</h4>
          <a href={asset(site.resume)} download>Download CV <ArrowUpRight size={15} /></a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {site.name}. All rights reserved.</span>
        <a href="#home" className="to-top">Back to top <ArrowUp size={14} /></a>
      </div>
    </footer>
  );
}
