"use client";
import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { site } from "@/data/site";

/* Opens the visitor's email app with the message pre-filled (no backend needed). */
export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", company: "", type: "Full-time role", message: "" });
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const subject = `${f.type}: ${f.name}${f.company ? ` (${f.company})` : ""}`;
    const body = `${f.message}\n\n— ${f.name}\n${f.email}${f.company ? `\n${f.company}` : ""}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="cf-head">
        <h3>Send a message</h3>
        <p>Fill this in and your email app opens with everything ready to send.</p>
      </div>
      <div className="form-row">
        <label>
          <span>Your name</span>
          <input required value={f.name} onChange={set("name")} placeholder="Jane Smith" autoComplete="name" />
        </label>
        <label>
          <span>Email</span>
          <input required type="email" value={f.email} onChange={set("email")} placeholder="jane@company.com" autoComplete="email" />
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>Company (optional)</span>
          <input value={f.company} onChange={set("company")} placeholder="Company name" autoComplete="organization" />
        </label>
        <label>
          <span>I&apos;m reaching out about</span>
          <select value={f.type} onChange={set("type")}>
            <option>Full-time role</option>
            <option>Freelance project</option>
            <option>Contract work</option>
            <option>Something else</option>
          </select>
        </label>
      </div>
      <label>
        <span>Message</span>
        <textarea required rows={5} value={f.message} onChange={set("message")} placeholder="Tell me about the role or project…" />
      </label>
      <div className="cf-foot">
        <button type="submit" className="btn btn-primary">
          Send message <Send size={17} />
        </button>
        {sent && (
          <span className="cf-sent"><CheckCircle2 size={16} /> Your email app should open now</span>
        )}
      </div>
    </form>
  );
}
