"use client";
import Image from "next/image";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { site } from "@/data/site";
import { asset } from "@/lib/asset";

/* Photo only — no chips. All the motion lives on the image itself:
   3D entrance, mouse tilt, floating, spinning gradient border, orbiting lights,
   breathing glow, scan line, cursor glare and a holographic platform. */
export default function HeroPortrait() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 120, damping: 15 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 15 });
  const gx = useSpring(useTransform(mx, [-0.5, 0.5], [0, 100]), { stiffness: 120, damping: 20 });
  const gy = useSpring(useTransform(my, [-0.5, 0.5], [0, 100]), { stiffness: 120, damping: 20 });
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.22), transparent 55%)`;

  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      className="portrait-wrap portrait-enter"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="portrait-float">
        <motion.div className="portrait-3d" style={{ rotateX: rx, rotateY: ry }}>
          {/* depth layers behind the photo */}
          <div className="portrait-aura" />
          <div className="portrait-ring" />
          <div className="portrait-halo" />

          {/* two tilted orbits with travelling lights */}
          <div className="portrait-orbit-ring o1"><i /></div>
          <div className="portrait-orbit-ring o2"><i /></div>

          <div className="portrait-frame">
            <div className="portrait-grid" />
            <Image
              src={asset(site.photo)}
              alt={`${site.name}, ${site.role}`}
              fill
              priority
              sizes="(max-width: 720px) 60vw, 320px"
              className="portrait-img"
            />
            <div className="portrait-shade" />
            <div className="portrait-scan" />
            <div className="portrait-intro-sweep" />
            <motion.div className="portrait-glare" style={{ background: glare }} />
          </div>

          {/* spinning gradient border (on top of the photo edge) */}
          <div className="portrait-border" />

          {/* rising sparkles */}
          <div className="portrait-sparks" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} style={{ "--i": i }} />
            ))}
          </div>

          {/* holographic platform */}
          <div className="portrait-base"><i /><i /><i /></div>
        </motion.div>
      </div>
    </div>
  );
}
