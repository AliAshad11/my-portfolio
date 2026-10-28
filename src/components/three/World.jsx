"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Billboard,
  Edges,
  Float,
  Grid,
  QuadraticBezierLine,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

/* =====================================================================
   ONE continuous 3D world behind the whole page.
   The camera flies forward (down -Z) as you scroll. Every section of the
   page has its own "station" of related models, and you pass through a
   glowing warp-gate between sections.
   ===================================================================== */

const CYAN = "#22d3ee";
const VIOLET = "#8b5cf6";
const PINK = "#ec4899";
const BLUE = "#3b82f6";
const GREEN = "#34d399";

const STEP = 16; // distance between stations
const STATIONS = 7; // hero, services, skills, projects, process, experience, contact
const CAM_START = 10;
const PATH = STEP * (STATIONS - 1);

/* shared scroll state (read by many components, written by the Rig) */
const flight = { progress: 0, velocity: 0 };

/* Which station the camera should be at, synced to the real page sections:
   when a section's top reaches the top of the screen, the camera arrives at its station. */
const SECTION_IDS = ["home", "services", "skills", "projects", "process", "experience", "contact"];
function sectionProgress() {
  const y = window.scrollY + window.innerHeight * 0.15;
  const tops = SECTION_IDS.map((id) => {
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top + window.scrollY : null;
  });
  if (tops.some((t) => t === null)) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? clamp(window.scrollY / max) : 0;
  }
  tops[0] = 0;
  const end = document.documentElement.scrollHeight - window.innerHeight * 0.85;
  let station = 0;
  for (let i = 0; i < tops.length; i++) {
    const a = tops[i];
    const b = i + 1 < tops.length ? tops[i + 1] : Math.max(end, a + 1);
    if (y >= a) station = i + clamp((y - a) / Math.max(b - a, 1));
  }
  return clamp(station / (STATIONS - 1));
}

/* ---------------------------------------------------------------- utils */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOutQuart = (p) => 1 - Math.pow(1 - p, 4);

let reduced = null;
const isReduced = () => {
  if (reduced === null) {
    reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return reduced;
};
const introTime = (clock) => clock.elapsedTime + (isReduced() ? 100 : 0);

function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let dotTexture = null;
function getDotTexture() {
  if (dotTexture || typeof document === "undefined") return dotTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.85)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  dotTexture = new THREE.CanvasTexture(c);
  dotTexture.colorSpace = THREE.SRGBColorSpace;
  return dotTexture;
}
const useDot = () => useMemo(() => getDotTexture(), []);

function useTextTexture(label, color, w = 256, h = 128, font = 72) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.font = `700 ${font}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.shadowColor = color;
    g.shadowBlur = 18;
    g.fillStyle = color;
    g.fillText(label, w / 2, h / 2 + 2);
    g.shadowBlur = 0;
    g.fillStyle = "rgba(255,255,255,0.88)";
    g.fillText(label, w / 2, h / 2 + 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [label, color, w, h, font]);
}

/* code-editor texture for the laptop screen */
function useCodeTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 320;
    const g = c.getContext("2d");
    const bg = g.createLinearGradient(0, 0, 512, 320);
    bg.addColorStop(0, "#0b1235");
    bg.addColorStop(1, "#160b33");
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 320);
    g.font = "600 19px ui-monospace, Menlo, Consolas, monospace";
    const lines = [
      [["const ", PINK], ["app", CYAN], [" = express();", "#cbd5e1"]],
      [["app.", "#cbd5e1"], ["get", CYAN], ["('/api/bookings',", "#a7f3d0"]],
      [["  async ", PINK], ["(req, res) => {", "#cbd5e1"]],
      [["    const ", PINK], ["rows", CYAN], [" = await db", "#cbd5e1"]],
      [["      .query(", "#cbd5e1"], ["'SELECT *'", "#a7f3d0"], [");", "#cbd5e1"]],
      [["    res.", "#cbd5e1"], ["json", CYAN], ["(rows);", "#cbd5e1"]],
      [["});", "#cbd5e1"]],
      [["", "#fff"]],
      [["export default ", PINK], ["<Hero />", "#c4b5fd"]],
    ];
    lines.forEach((parts, i) => {
      let x = 26;
      const y = 38 + i * 31;
      g.fillStyle = "rgba(148,163,184,0.45)";
      g.fillText(String(i + 1).padStart(2, " "), 2, y);
      parts.forEach(([txt, col]) => {
        g.fillStyle = col;
        g.fillText(txt, x + 18, y);
        x += g.measureText(txt).width;
      });
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
}

const glass = {
  color: "#0b1235",
  transparent: true,
  opacity: 0.45,
  roughness: 0.12,
  metalness: 0.35,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  envMapIntensity: 1.6,
};

/* =====================================================================
   Camera rig: scroll flight + intro dolly + mouse parallax + warp FOV
   ===================================================================== */
function Rig({ pointer, mobile, children }) {
  const lights = useRef();
  const base = mobile ? 58 : 48;
  useFrame(({ camera, clock }, dt) => {
    dt = Math.min(dt, 0.05);
    const target = sectionProgress();

    const prev = flight.progress;
    flight.progress += (target - flight.progress) * (1 - Math.pow(0.004, dt));
    const v = (flight.progress - prev) / Math.max(dt, 1e-4);
    flight.velocity += (v - flight.velocity) * 0.12;

    const t = clock.elapsedTime;
    const intro = easeOutQuart(clamp(introTime(clock) / 3.2));
    const p = pointer.current;
    const px = p.active ? p.x : Math.sin(t * 0.25) * 0.4;
    const py = p.active ? p.y : Math.cos(t * 0.2) * 0.25;
    const k = 1 - Math.pow(0.03, dt);

    const z = CAM_START - flight.progress * PATH + (1 - intro) * 16;
    const sway = Math.sin(flight.progress * Math.PI * 4) * (mobile ? 0.25 : 0.7);
    camera.position.z = z;
    camera.position.x += (px * (mobile ? 0.4 : 0.9) + sway - camera.position.x) * k;
    camera.position.y += (py * 0.5 + (1 - intro) * 3 - camera.position.y) * k;
    camera.lookAt(camera.position.x * 0.35, camera.position.y * 0.2, z - 14);
    camera.rotateZ(Math.sin(flight.progress * Math.PI * 2) * 0.035);

    // warp: widen the field of view a little while scrolling fast
    const warp = clamp(Math.abs(flight.velocity) * 45, 0, 12);
    const fov = base + warp;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov += (fov - camera.fov) * 0.1;
      camera.updateProjectionMatrix();
    }

    if (lights.current) lights.current.position.set(0, 0, z - 4);
  });
  return (
    <>
      <group ref={lights}>
        <pointLight position={[6, 4, 2]} color={CYAN} intensity={40} distance={30} />
        <pointLight position={[-6, -2, 2]} color={VIOLET} intensity={40} distance={30} />
        <pointLight position={[0, 6, -8]} color="#ffffff" intensity={12} distance={26} />
      </group>
      {children}
    </>
  );
}

/* Only render a station while the camera is near it (big GPU saving). */
function Station({ index, children }) {
  const g = useRef();
  const z = -index * STEP;
  useFrame(({ camera }) => {
    if (!g.current) return;
    const d = camera.position.z - z;
    g.current.visible = d > -10 && d < 44;
  });
  return (
    <group ref={g} position={[0, 0, z]}>
      {children}
    </group>
  );
}

/* =====================================================================
   Ambient layers that run along the whole flight path
   ===================================================================== */
function Starfield({ count }) {
  const tex = useDot();
  const [pos, col] = useMemo(() => {
    const rand = makeRng(99 + count);
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const palette = [CYAN, VIOLET, PINK, "#a5b4fc", "#ffffff"].map((h) => new THREE.Color(h));
    for (let i = 0; i < count; i++) {
      p[i * 3] = (rand() - 0.5) * 70;
      p[i * 3 + 1] = (rand() - 0.5) * 44;
      p[i * 3 + 2] = 24 - rand() * (PATH + 60);
      const cc = palette[Math.floor(rand() * palette.length)];
      c[i * 3] = cc.r;
      c[i * 3 + 1] = cc.g;
      c[i * 3 + 2] = cc.b;
    }
    return [p, c];
  }, [count]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.09} sizeAttenuation vertexColors transparent opacity={0.85} map={tex} alphaMap={tex}
        depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

/* Warp gate the camera flies through between two sections */
function Portal({ z, color = CYAN, radius = 7.5 }) {
  const g = useRef();
  const tex = useDot();
  const dots = useMemo(() => {
    const n = 90;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      p[i * 3] = Math.cos(a) * radius * 1.06;
      p[i * 3 + 1] = Math.sin(a) * radius * 1.06;
    }
    return p;
  }, [radius]);
  useFrame(({ camera }, dt) => {
    if (!g.current) return;
    g.current.rotation.z += dt * 0.12;
    const d = camera.position.z - z;
    g.current.visible = d > -4 && d < 40;
    // glow up as you approach, fade as you pass through
    const s = clamp(1 - Math.abs(d - 6) / 26);
    g.current.children.forEach((c) => {
      if (c.material) c.material.opacity = (c.userData.base ?? 0.6) * s;
    });
  });
  return (
    <group ref={g} position={[0, 0, z]}>
      <mesh userData={{ base: 0.55 }}>
        <torusGeometry args={[radius, 0.025, 8, 160]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh userData={{ base: 0.25 }} rotation={[0, 0, Math.PI / 8]}>
        <torusGeometry args={[radius * 0.94, 0.012, 6, 8]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.25} toneMapped={false} depthWrite={false} />
      </mesh>
      <points userData={{ base: 0.9 }}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dots, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.14} color={color} map={tex} alphaMap={tex} transparent opacity={0.9}
          depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
    </group>
  );
}

/* =====================================================================
   Models
   ===================================================================== */
function Pulse({ position, rotation, delay, color, max }) {
  const m = useRef();
  useFrame(({ clock }) => {
    const mesh = m.current;
    if (!mesh) return;
    const p = clamp((introTime(clock) - delay) / 2.6);
    mesh.visible = p > 0 && p < 1;
    if (!mesh.visible) return;
    mesh.scale.setScalar(Math.max((1 - Math.pow(1 - p, 3)) * max, 0.0001));
    mesh.material.opacity = 0.55 * Math.pow(1 - p, 1.6);
  });
  return (
    <mesh ref={m} position={position} rotation={rotation} visible={false}>
      <ringGeometry args={[0.97, 1, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false}
        blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

function Vortex({ count = 2400, radius = 3.4, ...props }) {
  const ref = useRef();
  const tex = useDot();
  const [positions, colors] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const inner = new THREE.Color(CYAN);
    const outer = new THREE.Color(VIOLET);
    const pink = new THREE.Color(PINK);
    const rand = makeRng(1337 + count);
    for (let i = 0; i < count; i++) {
      const r = Math.pow(rand(), 1.6) * radius;
      const branch = ((i % 4) / 4) * Math.PI * 2;
      const spread = 0.35 * (r / radius + 0.25);
      p[i * 3] = Math.cos(branch + r * 1.35) * r + (rand() - 0.5) * spread * 2;
      p[i * 3 + 1] = (rand() - 0.5) * spread * 0.8;
      p[i * 3 + 2] = Math.sin(branch + r * 1.35) * r + (rand() - 0.5) * spread * 2;
      const col = inner.clone().lerp(outer, r / radius);
      if (rand() < 0.08) col.lerp(pink, 0.7);
      c[i * 3] = col.r;
      c[i * 3 + 1] = col.g;
      c[i * 3 + 2] = col.b;
    }
    return [p, c];
  }, [count, radius]);
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const e = easeOutQuart(clamp((introTime(clock) - 0.2) / 3.2));
    ref.current.rotation.y += dt * (0.08 + 2.2 * Math.pow(1 - e, 2));
  });
  return (
    <group {...props}>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} sizeAttenuation vertexColors transparent map={tex} alphaMap={tex}
          depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
    </group>
  );
}

function Atom(props) {
  const group = useRef();
  const electrons = useRef([]);
  useFrame(({ clock }, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.35;
    const t = clock.elapsedTime;
    electrons.current.forEach((e, i) => {
      if (!e) return;
      const a = t * (1.4 + i * 0.25) + i * 2;
      e.position.set(Math.cos(a) * 1.15, Math.sin(a) * 0.42, 0);
    });
  });
  return (
    <group ref={group} {...props}>
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
          <mesh scale={[1.15, 0.42, 1]}>
            <torusGeometry args={[1, 0.018, 16, 120]} />
            <meshBasicMaterial color={CYAN} toneMapped={false} />
          </mesh>
          <mesh ref={(el) => (electrons.current[i] = el)}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#e0f2fe" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GlassWindow({ w = 2.6, h = 1.7, lines = 6, accent = CYAN, seed = 1, ...props }) {
  const codeLines = useMemo(() => {
    const rnd = makeRng(seed * 7919);
    const pal = [CYAN, VIOLET, PINK, "#94a3b8", BLUE];
    return Array.from({ length: lines }, (_, i) => {
      const segs = [];
      let x = -w / 2 + 0.22 + Math.floor(rnd() * 3) * 0.16;
      const n = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) {
        const len = 0.2 + rnd() * 0.55;
        if (x + len > w / 2 - 0.2) break;
        segs.push({ x: x + len / 2, len, color: pal[Math.floor(rnd() * pal.length)] });
        x += len + 0.08;
      }
      return { y: h / 2 - 0.42 - i * ((h - 0.6) / lines), segs };
    });
  }, [w, h, lines, seed]);
  return (
    <group {...props}>
      <mesh>
        <boxGeometry args={[w, h, 0.05]} />
        <meshPhysicalMaterial {...glass} />
        <Edges color={accent} threshold={15} />
      </mesh>
      <mesh position={[0, h / 2 - 0.13, 0.03]}>
        <boxGeometry args={[w - 0.02, 0.24, 0.01]} />
        <meshBasicMaterial color={accent} transparent opacity={0.14} toneMapped={false} />
      </mesh>
      {["#f87171", "#fbbf24", "#34d399"].map((c, i) => (
        <mesh key={c} position={[-w / 2 + 0.16 + i * 0.13, h / 2 - 0.13, 0.04]}>
          <circleGeometry args={[0.04, 20]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
      {codeLines.map((l, i) =>
        l.segs.map((s, k) => (
          <mesh key={`${i}-${k}`} position={[s.x, l.y, 0.035]}>
            <planeGeometry args={[s.len, 0.055]} />
            <meshBasicMaterial color={s.color} transparent opacity={0.85} toneMapped={false} />
          </mesh>
        ))
      )}
    </group>
  );
}

function Database(props) {
  const ring = useRef();
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 0.6;
  });
  return (
    <group {...props}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, i * 0.42, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.32, 48]} />
          <meshPhysicalMaterial color={VIOLET} transparent opacity={0.35} roughness={0.15} metalness={0.4}
            clearcoat={1} emissive={VIOLET} emissiveIntensity={0.25} />
          <Edges color="#c4b5fd" threshold={20} />
        </mesh>
      ))}
      <mesh ref={ring} position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.95, 0.012, 8, 80, Math.PI * 1.4]} />
        <meshBasicMaterial color={PINK} toneMapped={false} />
      </mesh>
    </group>
  );
}

const toVec = (lat, lon, r) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};

function Globe({ r = 1.3, ...props }) {
  const ref = useRef();
  const tex = useDot();
  const dots = useMemo(() => {
    const n = 520;
    const p = new Float32Array(n * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      p[i * 3] = Math.cos(golden * i) * rad * r;
      p[i * 3 + 1] = y * r;
      p[i * 3 + 2] = Math.sin(golden * i) * rad * r;
    }
    return p;
  }, [r]);
  // Islamabad -> UK, Ireland, US, UAE, Australia
  const arcs = useMemo(() => {
    const home = toVec(33.7, 73.1, r);
    return [[51.5, -0.1], [53.3, -6.2], [40.7, -74], [25.2, 55.3], [-33.9, 151.2]].map(([la, lo]) => {
      const end = toVec(la, lo, r);
      const mid = home.clone().add(end).multiplyScalar(0.5).setLength(r * 1.55);
      return { start: home, end, mid };
    });
  }, [r]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.12;
  });
  return (
    <group ref={ref} {...props}>
      <mesh>
        <icosahedronGeometry args={[r, 3]} />
        <meshBasicMaterial color={BLUE} wireframe transparent opacity={0.1} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dots, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color={CYAN} map={tex} alphaMap={tex} transparent depthWrite={false}
          blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      {arcs.map((a, i) => (
        <QuadraticBezierLine key={i} start={a.start} end={a.end} mid={a.mid} color={i % 2 ? PINK : CYAN}
          lineWidth={1.4} transparent opacity={0.9} />
      ))}
    </group>
  );
}

function Glyph({ children, color = CYAN, size = 0.45, ...props }) {
  const tex = useTextTexture(children, color);
  return (
    <group {...props}>
      <Float speed={1.6} rotationIntensity={0.6} floatIntensity={1.2}>
        <mesh>
          <planeGeometry args={[size * 2.6, size * 1.3]} />
          <meshBasicMaterial map={tex} transparent opacity={0.9} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </Float>
    </group>
  );
}

/* --- Services: laptop with live code + spinning gear --- */
function Laptop(props) {
  const lid = useRef();
  const tex = useCodeTexture();
  useFrame(({ clock }) => {
    if (lid.current) lid.current.rotation.x = -(Math.PI / 2 + 0.22) + Math.sin(clock.elapsedTime * 0.7) * 0.03;
  });
  const keys = useMemo(() => {
    const out = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 11; c++) out.push([-1.25 + c * 0.25, 0.07, -0.55 + r * 0.24]);
    return out;
  }, []);
  return (
    <group {...props}>
      <mesh>
        <boxGeometry args={[3, 0.12, 2]} />
        <meshPhysicalMaterial {...glass} opacity={0.6} />
        <Edges color={CYAN} threshold={15} />
      </mesh>
      {keys.map((k, i) => (
        <mesh key={i} position={k}>
          <boxGeometry args={[0.18, 0.02, 0.17]} />
          <meshBasicMaterial color={i % 7 === 0 ? CYAN : "#312e81"} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.07, 0.72]}>
        <boxGeometry args={[0.9, 0.01, 0.4]} />
        <meshBasicMaterial color="#1e1b4b" />
      </mesh>
      <group ref={lid} position={[0, 0.06, -1]} rotation={[-(Math.PI / 2 + 0.22), 0, 0]}>
        <mesh position={[0, 0, 1]}>
          <boxGeometry args={[3, 0.06, 2]} />
          <meshPhysicalMaterial {...glass} opacity={0.6} />
          <Edges color={VIOLET} threshold={15} />
        </mesh>
        <mesh position={[0, -0.035, 1]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.8, 1.8]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Gear({ color = VIOLET, teeth = 12, speed = 0.4, ...props }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed;
  });
  return (
    <group {...props}>
      <group ref={ref}>
        <mesh>
          <torusGeometry args={[1, 0.26, 16, 64]} />
          <meshPhysicalMaterial color={color} metalness={0.6} roughness={0.25} clearcoat={1} emissive={color} emissiveIntensity={0.18} />
        </mesh>
        {Array.from({ length: teeth }, (_, i) => {
          const a = (i / teeth) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.32, Math.sin(a) * 1.32, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.32, 0.26, 0.3]} />
              <meshPhysicalMaterial color={color} metalness={0.6} roughness={0.25} emissive={color} emissiveIntensity={0.18} />
            </mesh>
          );
        })}
        <mesh>
          <cylinderGeometry args={[0.28, 0.28, 0.4, 32]} />
          <meshBasicMaterial color={CYAN} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* --- Skills: glowing core with tech labels orbiting it --- */
const ORBIT_TAGS = [
  ["React", CYAN], ["Next.js", "#ffffff"], ["Laravel", PINK], ["Node", GREEN],
  ["PHP", "#a5b4fc"], ["MySQL", BLUE], ["Mongo", GREEN], ["Woo", VIOLET],
];
function OrbitTag({ label, color }) {
  const tex = useTextTexture(label, color, 320, 110, 54);
  return (
    <Billboard>
      <mesh>
        <planeGeometry args={[1.5, 0.52]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}
function TechOrbit({ compact, ...props }) {
  const ring = useRef();
  const core = useRef();
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.y += dt * 0.25;
    if (core.current) {
      core.current.rotation.x += dt * 0.2;
      core.current.rotation.y += dt * 0.3;
    }
  });
  const tags = compact ? ORBIT_TAGS.slice(0, 6) : ORBIT_TAGS;
  return (
    <group {...props}>
      <group ref={core}>
        <mesh>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshBasicMaterial color={VIOLET} wireframe transparent opacity={0.5} toneMapped={false} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.6} flatShading toneMapped={false} />
        </mesh>
      </group>
      <group rotation={[0.35, 0, 0.15]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.3, 0.01, 6, 120]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.4} toneMapped={false} />
        </mesh>
        <group ref={ring}>
          {tags.map(([label, color], i) => {
            const a = (i / tags.length) * Math.PI * 2;
            return (
              <group key={label} position={[Math.cos(a) * 2.3, Math.sin(a * 2) * 0.25, Math.sin(a) * 2.3]}>
                <OrbitTag label={label} color={color} />
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
}

/* --- Projects: a fan of floating browser windows --- */
function BrowserFan(props) {
  const g = useRef();
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.15;
  });
  return (
    <group {...props}>
      <group ref={g}>
        <GlassWindow w={2.6} h={1.7} seed={3} accent={VIOLET} position={[-0.9, -0.5, -0.8]} rotation={[0, 0.35, 0]} />
        <GlassWindow w={2.6} h={1.7} seed={11} accent={PINK} position={[0.9, 0.6, -0.4]} rotation={[0, -0.25, 0]} />
        <GlassWindow w={2.8} h={1.8} seed={5} accent={CYAN} position={[0, 0, 0.4]} />
      </group>
    </group>
  );
}

/* --- Process: DNA-style helix (plan -> build -> test -> launch) --- */
function Helix({ n = 26, ...props }) {
  const g = useRef();
  const tex = useDot();
  const nodes = useMemo(() => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const y = (i / (n - 1) - 0.5) * 6;
      const a = i * 0.55;
      out.push({ y, a });
    }
    return out;
  }, [n]);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.45;
  });
  return (
    <group {...props}>
      <group ref={g}>
        {nodes.map(({ y, a }, i) => {
          const x1 = Math.cos(a) * 0.9;
          const z1 = Math.sin(a) * 0.9;
          return (
            <group key={i}>
              <mesh position={[x1, y, z1]}>
                <sphereGeometry args={[0.09, 16, 16]} />
                <meshBasicMaterial color={CYAN} toneMapped={false} />
              </mesh>
              <mesh position={[-x1, y, -z1]}>
                <sphereGeometry args={[0.09, 16, 16]} />
                <meshBasicMaterial color={PINK} toneMapped={false} />
              </mesh>
              {i % 2 === 0 && (
                <mesh position={[0, y, 0]} rotation={[0, -a, Math.PI / 2]}>
                  <cylinderGeometry args={[0.015, 0.015, 1.8, 6]} />
                  <meshBasicMaterial color={VIOLET} transparent opacity={0.6} toneMapped={false} />
                </mesh>
              )}
            </group>
          );
        })}
        <sprite scale={[3, 3, 1]}>
          <spriteMaterial map={tex} color={VIOLET} transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </group>
  );
}

/* --- Experience: rising growth staircase + briefcase --- */
function GrowthBars(props) {
  const bars = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bars.current.forEach((b, i) => {
      if (!b) return;
      const h = 0.5 + i * 0.45 + Math.sin(t * 1.2 + i) * 0.08;
      b.scale.y = h;
      b.position.y = h / 2;
    });
  });
  return (
    <group {...props}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} ref={(el) => (bars.current[i] = el)} position={[i * 0.55 - 1.4, 0.5, 0]}>
          <boxGeometry args={[0.38, 1, 0.38]} />
          <meshPhysicalMaterial color={i === 5 ? CYAN : VIOLET} transparent opacity={0.55} metalness={0.4} roughness={0.2}
            emissive={i === 5 ? CYAN : VIOLET} emissiveIntensity={0.35} />
          <Edges color={i === 5 ? "#a5f3fc" : "#c4b5fd"} />
        </mesh>
      ))}
      <mesh position={[1.6, 3.5, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <coneGeometry args={[0.22, 0.45, 4]} />
        <meshBasicMaterial color={GREEN} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 1.4]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.08} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Briefcase(props) {
  return (
    <group {...props}>
      <RoundedBox args={[1.9, 1.3, 0.6]} radius={0.12} smoothness={4}>
        <meshPhysicalMaterial color="#1e1b4b" metalness={0.5} roughness={0.25} clearcoat={1} emissive={VIOLET} emissiveIntensity={0.15} />
      </RoundedBox>
      <mesh position={[0, 0.78, 0]}>
        <torusGeometry args={[0.32, 0.06, 12, 32, Math.PI]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.1, 0.31]}>
        <boxGeometry args={[1.9, 0.06, 0.02]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.1, 0.33]}>
        <boxGeometry args={[0.3, 0.22, 0.04]} />
        <meshBasicMaterial color={PINK} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* --- Contact: paper plane with a light trail + chat bubble --- */
function usePlaneGeometry() {
  return useMemo(() => {
    const nose = [0, 0, 1.2], left = [-1, 0.05, -0.6], right = [1, 0.05, -0.6], back = [0, 0.05, -0.6], keel = [0, -0.4, -0.6];
    const v = new Float32Array([...nose, ...left, ...back, ...nose, ...back, ...right, ...nose, ...keel, ...back]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(v, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
}
function PaperPlane({ radius = 2.4, ...props }) {
  const plane = useRef();
  const ghosts = useRef([]);
  const geo = usePlaneGeometry();
  const tex = useDot();
  const path = (t) => [Math.cos(t) * radius, Math.sin(t * 2) * 0.5, Math.sin(t) * radius * 0.6];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.7;
    const m = plane.current;
    if (!m) return;
    m.position.set(...path(t));
    m.rotation.set(0, Math.atan2(-Math.sin(t) * radius, Math.cos(t) * radius * 0.6), -0.45);
    // glowing trail: sprites placed where the plane was a moment ago
    ghosts.current.forEach((g, i) => g && g.position.set(...path(t - (i + 1) * 0.045)));
  });
  return (
    <group {...props}>
      <mesh ref={plane} geometry={geo} scale={0.55}>
        <meshStandardMaterial color="#e0f2fe" emissive={CYAN} emissiveIntensity={0.5} side={THREE.DoubleSide} flatShading />
      </mesh>
      {Array.from({ length: 18 }, (_, i) => (
        <sprite key={i} ref={(el) => (ghosts.current[i] = el)} scale={0.34 * (1 - i / 20)}>
          <spriteMaterial map={tex} color={i % 3 ? CYAN : VIOLET} transparent opacity={0.75 * (1 - i / 18)}
            depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
}

function ChatBubble(props) {
  const dots = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    dots.current.forEach((d, i) => {
      if (d) d.position.y = 0.05 + Math.max(0, Math.sin(t * 4 - i * 0.7)) * 0.14;
    });
  });
  return (
    <group {...props}>
      <RoundedBox args={[2.4, 1.4, 0.3]} radius={0.3} smoothness={5}>
        <meshPhysicalMaterial {...glass} opacity={0.6} color="#1b1145" />
      </RoundedBox>
      <mesh position={[-0.75, -0.82, 0]} rotation={[0, 0, Math.PI / 5]}>
        <coneGeometry args={[0.22, 0.45, 3]} />
        <meshPhysicalMaterial {...glass} opacity={0.6} color="#1b1145" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (dots.current[i] = el)} position={[-0.45 + i * 0.45, 0.05, 0.18]}>
          <sphereGeometry args={[0.12, 20, 20]} />
          <meshBasicMaterial color={[CYAN, VIOLET, PINK][i]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* =====================================================================
   Layout of every station (desktop + mobile)
   ===================================================================== */
function Scene({ pointer, mobile }) {
  const X = mobile ? 0.48 : 1; // squeeze sideways on phones
  const Z = mobile ? -3 : 0; // and push a bit further back
  const s = mobile ? 0.7 : 1;
  const pulseRot = [-Math.PI / 2 + 0.42, 0, 0.12];
  const vortex = [mobile ? 0 : 3.9, -0.5, -4 + Z];

  return (
    <Rig pointer={pointer} mobile={mobile}>
      <Starfield count={mobile ? 1000 : 2200} />

      {/* floor grid that travels with the camera */}
      <Grid position={[0, -5.2, 0]} args={[40, 40]} cellSize={0.7} cellThickness={0.6} cellColor="#1b2a55"
        sectionSize={3.5} sectionThickness={1.1} sectionColor="#2b6cb0" fadeDistance={32} fadeStrength={2.2}
        infiniteGrid followCamera />

      {/* warp gates between sections */}
      {Array.from({ length: STATIONS - 1 }, (_, i) => (
        <Portal key={i} z={-8 - i * STEP} color={i % 2 ? VIOLET : CYAN} radius={mobile ? 5.2 : 8} />
      ))}

      {/* 0 — HERO */}
      <Station index={0}>
        <Pulse position={vortex} rotation={pulseRot} delay={0.45} color={CYAN} max={mobile ? 7 : 11} />
        <Pulse position={vortex} rotation={pulseRot} delay={0.85} color={VIOLET} max={mobile ? 8 : 13} />
        <Vortex count={mobile ? 1000 : 2000} position={vortex} rotation={[0.42, 0, 0.12]} scale={mobile ? 0.8 : 1} />
        <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
          <Atom position={[6.2 * X, 2.6, -3 + Z]} scale={0.7 * s} rotation={[0.3, 0, 0.2]} />
        </Float>
        <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.6}>
          <GlassWindow w={2.8} h={1.8} seed={7} accent={CYAN} position={[mobile ? -2.6 : 3.4, mobile ? 5.4 : 5.2, -13 + Z]} rotation={[0.05, -0.2, -0.04]} scale={0.8 * s} />
        </Float>
        <Float speed={1.3} rotationIntensity={0.3} floatIntensity={0.7}>
          <GlassWindow w={2} h={1.3} seed={21} accent={VIOLET} position={[6.6 * X, -2.6, -3 + Z]} rotation={[-0.08, -0.5, 0.05]} scale={s} />
        </Float>
        <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
          <Database position={[-4.6 * X, -3.6, -6 + Z]} rotation={[0.25, 0.3, 0]} scale={0.8 * s} />
        </Float>
        <Globe r={mobile ? 1 : 1.35} position={[1.2 * X, 3.6, -10 + Z]} />
        {!mobile && (
          <>
            <Glyph color={CYAN} size={0.42} position={[3.6, 3.9, -7]}>{"</>"}</Glyph>
            <Glyph color={VIOLET} size={0.5} position={[9, -3.4, -9]}>{"{ }"}</Glyph>
            <Glyph color={PINK} size={0.32} position={[1.6, -3.4, -5]}>{"API"}</Glyph>
            <Glyph color={BLUE} size={0.28} position={[-1.8, -4, -4]}>{"SQL"}</Glyph>
          </>
        )}
      </Station>

      {/* 1 — SERVICES */}
      <Station index={1}>
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
          <Laptop position={[6 * X, -1.2, -5 + Z]} rotation={[0.2, -0.55, 0]} scale={s} />
        </Float>
        <Gear position={[-6.5 * X, 2.6, -7 + Z]} scale={0.8 * s} />
        <Gear position={[-5.1 * X, 0.9, -7.4 + Z]} scale={0.5 * s} color={CYAN} speed={-0.65} teeth={9} />
        {!mobile && <Glyph color={CYAN} size={0.4} position={[-4, -3.2, -5]}>{"=>"}</Glyph>}
      </Station>

      {/* 2 — SKILLS */}
      <Station index={2}>
        <TechOrbit compact={mobile} position={[-5.8 * X, 0.4, -6 + Z]} scale={s} />
        <Float speed={1.2} rotationIntensity={1} floatIntensity={0.8}>
          <mesh position={[6.4 * X, -1.8, -7 + Z]} scale={s}>
            <torusKnotGeometry args={[0.9, 0.25, 140, 16]} />
            <meshPhysicalMaterial color={PINK} metalness={0.5} roughness={0.2} clearcoat={1} emissive={PINK} emissiveIntensity={0.2} />
          </mesh>
        </Float>
      </Station>

      {/* 3 — PROJECTS */}
      <Station index={3}>
        <BrowserFan position={[6.4 * X, 1.4, -7 + Z]} rotation={[0, -0.45, 0]} scale={0.9 * s} />
        <BrowserFan position={[-6.6 * X, -1.8, -9 + Z]} rotation={[0, 0.5, 0]} scale={0.75 * s} />
      </Station>

      {/* 4 — PROCESS */}
      <Station index={4}>
        <Helix position={[-6 * X, 0.4, -6 + Z]} scale={s} rotation={[0, 0, 0.25]} />
        <Gear position={[6.2 * X, 2.2, -7 + Z]} scale={0.7 * s} color={CYAN} speed={0.5} />
        {!mobile && <Glyph color={GREEN} size={0.36} position={[5.5, -2.8, -6]}>{"git"}</Glyph>}
      </Station>

      {/* 5 — EXPERIENCE */}
      <Station index={5}>
        <GrowthBars position={[5.4 * X, -2.6, -6 + Z]} rotation={[0.1, -0.5, 0]} scale={s} />
        <Float speed={1.2} rotationIntensity={0.5} floatIntensity={0.8}>
          <Briefcase position={[-6.2 * X, 1.6, -7 + Z]} rotation={[0.1, 0.5, 0.05]} scale={s} />
        </Float>
      </Station>

      {/* 6 — CONTACT */}
      <Station index={6}>
        <PaperPlane position={[4.6 * X, 1, -6 + Z]} radius={mobile ? 1.6 : 2.4} />
        <Float speed={1.3} rotationIntensity={0.4} floatIntensity={0.8}>
          <ChatBubble position={[-6.2 * X, -0.6, -7 + Z]} rotation={[0, 0.45, 0]} scale={s} />
        </Float>
        <Globe r={mobile ? 0.9 : 1.2} position={[-4.5 * X, 3.4, -11 + Z]} />
        {!mobile && <Glyph color={CYAN} size={0.4} position={[6.5, -3, -7]}>{"@"}</Glyph>}
      </Station>
    </Rig>
  );
}

function Responsive({ pointer }) {
  const width = useThree((st) => st.size.width);
  return <Scene pointer={pointer} mobile={width < 960} />;
}

export default function World({ pointer, mobile }) {
  return (
    <Canvas
      dpr={[1, 1.25]}
      camera={{ position: [0, 3, CAM_START + 16], fov: mobile ? 58 : 48, near: 0.1, far: 90 }}
      gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#05030f", 10, 33]} />
      <ambientLight intensity={0.4} />
      <hemisphereLight args={["#7dd3fc", "#4c1d95", 0.9]} />
      <Responsive pointer={pointer} />
    </Canvas>
  );
}
