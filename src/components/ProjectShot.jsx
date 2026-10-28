"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import { asset } from "@/lib/asset";

// Live screenshot service — used only if the local screenshot file is missing.
export const liveShot = (url, mobile = false) =>
  mobile
    ? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?vpw=390&vph=844&w=390&h=844`
    : `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1440&h=900`;


/* mshots first answers with a small "generating preview" placeholder.
   We detect it by size and quietly retry until the real screenshot is ready. */
const isPlaceholder = (img, mobile) =>
  mobile ? img.naturalHeight > 0 && img.naturalHeight < 700 : img.naturalWidth > 0 && img.naturalWidth < 1000;

/**
 * Project screenshot with no broken / error states:
 * local file (/public/images/projects/...) → live screenshot (with retries) → branded card.
 */
export default function ProjectShot({ src, url, alt, title, domain, mobile = false, className = "", eager = false }) {
  const sources = useMemo(
    () => [asset(src), url && liveShot(url, mobile)].filter(Boolean),
    [src, url, mobile]
  );
  const [i, setI] = useState(0);
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const current = sources[i];
  const live = current?.includes("mshots");
  const finalSrc = live && retry ? `${current}&r=${retry}` : current;

  const next = () => {
    setLoaded(false);
    setRetry(0);
    setI((n) => n + 1);
  };

  const onLoad = (e) => {
    const img = e.currentTarget;
    if (live && isPlaceholder(img, mobile)) {
      // the first capture of a site can take up to ~1 minute, so keep waiting patiently
      if (retry < 14) timer.current = setTimeout(() => setRetry((r) => r + 1), 3000 + retry * 700);
      else next();
      return;
    }
    setLoaded(true);
  };

  // catch images that finished (or failed) before React hydrated
  useEffect(() => {
    const img = ref.current;
    if (!img || !img.complete) return;
    if (img.naturalWidth === 0) next();
    else onLoad({ currentTarget: img });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (i >= sources.length) {
    const label = title || alt || "";
    return (
      <div className={`shot-fallback ${className}`} role="img" aria-label={alt}>
        <span className="sf-mark">{label.charAt(0) || "•"}</span>
        <b>{label}</b>
        {domain && <small>{domain}</small>}
      </div>
    );
  }

  return (
    <img
      ref={ref}
      key={finalSrc}
      src={finalSrc}
      alt={alt}
      className={`${className} shot-img`}
      data-loaded={loaded}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onLoad={onLoad}
      onError={next}
    />
  );
}
