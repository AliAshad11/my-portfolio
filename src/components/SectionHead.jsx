import Reveal from "./Reveal";

export default function SectionHead({ tag, title, accent, sub, children, row = false, center = false }) {
  return (
    <Reveal className={`section-head ${row ? "row" : ""} ${center ? "center" : ""}`}>
      <div>
        <span className="section-tag">
          <i /> {tag}
        </span>
        <h2 className="section-title">
          {title} {accent && <span className="grad-text">{accent}</span>}
        </h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {children}
    </Reveal>
  );
}
