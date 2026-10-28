/* Scroll reveal with ZERO JavaScript.
   Content is always visible in the HTML. In browsers that support CSS scroll-driven
   animations (Chrome, Edge, Safari 26+), it rises in as it scrolls into view;
   elsewhere it simply shows. Nothing ever waits for JavaScript to appear. */
export default function Reveal({ children, delay = 0, className = "", style, as: Tag = "div" }) {
  return (
    <Tag className={`reveal ${className}`} style={{ "--rd": Math.min(delay * 10, 4), ...style }}>
      {children}
    </Tag>
  );
}
