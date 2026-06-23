import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

/* ─── Injected keyframes ─────────────────────────────────────────────────── */
const KEYFRAMES = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.55); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes orbitExpand {
  from { opacity: 0; transform: translate(-50%, -56%) scale(0.3); }
  to   { opacity: 1; transform: translate(-50%, -56%) scale(1); }
}
@keyframes drawStroke {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}
@keyframes pulsate {
  0%,100% { box-shadow: 0 0 18px rgba(60,100,255,0.18), 0 2px 8px rgba(0,0,0,0.4); }
  50%     { box-shadow: 0 0 32px rgba(80,130,255,0.42), 0 2px 12px rgba(0,0,0,0.5); }
}
@keyframes bobble {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(5px); }
}
@keyframes glowPulse {
  0%,100% { filter: drop-shadow(0 0 6px rgba(100,160,255,0.0)); }
  50%     { filter: drop-shadow(0 0 20px rgba(100,160,255,0.60)); }
}
@keyframes loaderFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes loaderFadeOut {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(1.06); }
}
@keyframes labelPulse {
  0%,100% { opacity: 0.35; letter-spacing: 0.35em; }
  50%     { opacity: 0.75; letter-spacing: 0.42em; }
}
@keyframes ringExpand {
  0%   { transform: scale(0.82); opacity: 0.6; }
  100% { transform: scale(1.55); opacity: 0; }
}
`;

function StyleInjector() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

/* ─── Spinning 3-D globe via canvas ─────────────────────────────────────── */
function SpinningGlobeCanvas({ size = 260 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.42;

    let angle = 0;

    // Project a 3D point on the sphere surface to 2D canvas coords
    const project = (lat: number, lon: number): [number, number, number] => {
      const phi = (lat * Math.PI) / 180;
      const theta = (lon * Math.PI) / 180 + angle;
      const x3 = Math.cos(phi) * Math.sin(theta);
      const y3 = Math.sin(phi);
      const z3 = Math.cos(phi) * Math.cos(theta);
      return [cx + x3 * R, cy - y3 * R, z3];
    };

    const drawGrid = () => {
      ctx.clearRect(0, 0, size, size);

      // Subtle glow background
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
      g.addColorStop(0, "rgba(40, 80, 180, 0.06)");
      g.addColorStop(1, "rgba(10, 20, 60, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      // Latitude lines
      const latitudes = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
      latitudes.forEach((lat) => {
        const steps = 120;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= steps; i++) {
          const lon = (i / steps) * 360 - 180;
          const [px, py, z] = project(lat, lon);
          const alpha = Math.max(0, z);
          if (z > -0.1) {
            if (!started) { ctx.moveTo(px, py); started = true; }
            else ctx.lineTo(px, py);
          } else {
            started = false;
          }
          void alpha;
        }
        const isEquator = lat === 0;
        ctx.strokeStyle = isEquator
          ? "rgba(140,190,255,0.40)"
          : "rgba(100,160,255,0.18)";
        ctx.lineWidth = isEquator ? 1.2 : 0.7;
        ctx.stroke();
      });

      // Longitude lines
      const longitudes = Array.from({ length: 18 }, (_, i) => i * 20 - 180);
      longitudes.forEach((lon) => {
        const steps = 90;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= steps; i++) {
          const lat = (i / steps) * 180 - 90;
          const [px, py, z] = project(lat, lon);
          if (z > -0.08) {
            if (!started) { ctx.moveTo(px, py); started = true; }
            else ctx.lineTo(px, py);
          } else {
            started = false;
          }
        }
        const isPrime = lon === 0;
        ctx.strokeStyle = isPrime
          ? "rgba(140,190,255,0.38)"
          : "rgba(100,160,255,0.15)";
        ctx.lineWidth = isPrime ? 1.1 : 0.6;
        ctx.stroke();
      });

      // Outer rim glow
      const rim = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.05);
      rim.addColorStop(0, "rgba(80,140,255,0.0)");
      rim.addColorStop(0.7, "rgba(80,140,255,0.12)");
      rim.addColorStop(1, "rgba(80,140,255,0.0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120,180,255,0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.04, 0, Math.PI * 2);
      ctx.strokeStyle = rim;
      ctx.lineWidth = 6;
      ctx.stroke();
    };

    const tick = () => {
      angle += 0.008;
      drawGrid();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [size]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}

/* ─── Full-screen loader ─────────────────────────────────────────────────── */
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Show the globe for 2.6 s then start the exit animation
    const t1 = setTimeout(() => setExiting(true), 2600);
    // Call onDone after exit animation (0.7 s)
    const t2 = setTimeout(onDone, 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "hsl(222, 50%, 4%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        animation: exiting
          ? "loaderFadeOut 0.7s cubic-bezier(0.4,0,0.2,1) forwards"
          : "loaderFadeIn 0.5s ease forwards",
        gap: "2rem",
      }}
    >
      {/* Expanding ring behind globe */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[0, 0.6, 1.2].map((delay) => (
          <div
            key={delay}
            aria-hidden="true"
            style={{
              position: "absolute",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              border: "1px solid rgba(80,140,255,0.25)",
              animation: `ringExpand 2.4s cubic-bezier(0.4,0,0.2,1) ${delay}s infinite`,
            }}
          />
        ))}

        {/* Globe itself */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            filter: "drop-shadow(0 0 24px rgba(80,140,255,0.30))",
          }}
        >
          <SpinningGlobeCanvas size={240} />
        </div>
      </div>

      {/* Loading label */}
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.68rem",
          letterSpacing: "0.38em",
          textTransform: "uppercase",
          color: "rgba(140, 175, 230, 0.5)",
          animation: "labelPulse 1.8s ease-in-out infinite",
        }}
      >
        LOADING
      </span>
    </div>
  );
}

/* ─── Animated star canvas ───────────────────────────────────────────────── */
function StarCanvas({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Star = { x: number; y: number; r: number; alpha: number; speed: number };
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.2,
        alpha: Math.random() * 0.7 + 0.15,
        speed: Math.random() * 0.003 + 0.001,
      });
    }

    const constellationDots = [
      { x: 0.12, y: 0.22 }, { x: 0.38, y: 0.08 }, { x: 0.65, y: 0.18 },
      { x: 0.88, y: 0.12 }, { x: 0.82, y: 0.35 }, { x: 0.25, y: 0.45 },
      { x: 0.72, y: 0.52 }, { x: 0.45, y: 0.75 }, { x: 0.15, y: 0.68 },
      { x: 0.92, y: 0.70 }, { x: 0.58, y: 0.88 },
    ];
    const connections = [[0,1],[1,2],[2,4],[4,6],[3,4],[5,8],[6,9],[7,10]];

    let animId: number;
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.005;
      stars.forEach((s) => {
        const flicker = Math.sin(t * 20 * s.speed + s.x) * 0.15;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${Math.max(0, s.alpha + flicker)})`;
        ctx.fill();
      });
      connections.forEach(([a, b]) => {
        const da = constellationDots[a];
        const db = constellationDots[b];
        ctx.beginPath();
        ctx.moveTo(da.x * canvas.width, da.y * canvas.height);
        ctx.lineTo(db.x * canvas.width, db.y * canvas.height);
        ctx.strokeStyle = "rgba(100, 150, 255, 0.08)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
      constellationDots.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x * canvas.width, d.y * canvas.height, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(120, 170, 255, 0.6)";
        ctx.fill();
        const g = ctx.createRadialGradient(
          d.x * canvas.width, d.y * canvas.height, 0,
          d.x * canvas.width, d.y * canvas.height, 8
        );
        g.addColorStop(0, "rgba(100, 160, 255, 0.25)");
        g.addColorStop(1, "rgba(100, 160, 255, 0)");
        ctx.beginPath();
        ctx.arc(d.x * canvas.width, d.y * canvas.height, 8, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        opacity: visible ? 1 : 0,
        transition: "opacity 1.0s ease 0.3s",
      }}
    />
  );
}

/* ─── Globe icon (static, line-draw on mount) ────────────────────────────── */
function GlobeIcon({ animate }: { animate: boolean }) {
  const strokeProps = (delay: string) =>
    animate
      ? {
          strokeDasharray: "1",
          strokeDashoffset: "1" as unknown as number,
          style: {
            animation: `drawStroke 1.4s cubic-bezier(0.4,0,0.2,1) ${delay} forwards`,
          } as React.CSSProperties,
        }
      : { strokeDasharray: "1", strokeDashoffset: "1" as unknown as number };

  return (
    <svg
      viewBox="0 0 100 100"
      width="90"
      height="90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={animate ? { animation: "glowPulse 3s ease-in-out 2s infinite" } : undefined}
    >
      <circle cx="50" cy="50" r="44" stroke="rgba(200,220,255,0.35)" strokeWidth="1.2" pathLength={1} {...strokeProps("0.1s")} />
      <ellipse cx="50" cy="50" rx="20" ry="44" stroke="rgba(200,220,255,0.28)" strokeWidth="1.2" pathLength={1} {...strokeProps("0.25s")} />
      <ellipse cx="50" cy="50" rx="38" ry="44" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" pathLength={1} {...strokeProps("0.4s")} />
      <ellipse cx="50" cy="50" rx="44" ry="16" stroke="rgba(200,220,255,0.28)" strokeWidth="1.2" pathLength={1} {...strokeProps("0.55s")} />
      <ellipse cx="50" cy="32" rx="34" ry="10" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" pathLength={1} {...strokeProps("0.7s")} />
      <ellipse cx="50" cy="68" rx="34" ry="10" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" pathLength={1} {...strokeProps("0.85s")} />
      <text
        x="50" y="56"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="22"
        fontWeight="400"
        letterSpacing="1"
        style={
          animate
            ? { fill: "rgba(220,235,255,0.90)", opacity: 0, animation: "fadeIn 0.6s ease 0.9s forwards" }
            : { fill: "rgba(220,235,255,0.90)" }
        }
      >
        T
      </text>
    </svg>
  );
}

/* ─── Landing page ───────────────────────────────────────────────────────── */
function Home() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"hidden" | "reveal" | "done">("hidden");
  const [globeAnimate, setGlobeAnimate] = useState(false);

  useEffect(() => {
    // Stagger: small delay then reveal
    const t1 = setTimeout(() => { setPhase("reveal"); setGlobeAnimate(true); }, 80);
    const t2 = setTimeout(() => setPhase("done"), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); };

  const anim = (name: string, dur: string, delay: string): React.CSSProperties =>
    phase !== "hidden"
      ? { animation: `${name} ${dur} cubic-bezier(0.4,0,0.2,1) ${delay} both` }
      : { opacity: 0 };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden"
      style={{ background: "hsl(222, 47%, 5%)" }}
    >
      <StarCanvas visible={phase !== "hidden"} />

      {/* Orbit rings */}
      {(["520px", "360px"] as const).map((sz, i) => (
        <div key={sz} aria-hidden="true" style={{
          position: "absolute", top: "50%", left: "50%",
          width: sz, height: sz, borderRadius: "50%",
          border: `1px solid rgba(160,190,255,${i === 0 ? "0.09" : "0.06"})`,
          zIndex: 1, pointerEvents: "none",
          ...anim("orbitExpand", "1.0s", `${0.5 + i * 0.15}s`),
        }} />
      ))}

      {/* Aurora waves */}
      <div aria-hidden="true" style={{
        position: "absolute", bottom: 0, left: 0, width: "100%", height: "320px",
        zIndex: 1, pointerEvents: "none", overflow: "hidden",
        ...anim("fadeIn", "1.4s", "1.6s"),
      }}>
        <svg viewBox="0 0 800 320" preserveAspectRatio="none" width="100%" height="100%"
          xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", bottom: 0, left: 0 }}>
          <defs>
            <filter id="glow1"><feGaussianBlur stdDeviation="4" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow2"><feGaussianBlur stdDeviation="6" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <path d="M -60 280 Q 80 200 180 240 Q 260 270 320 220" stroke="rgba(40,100,255,0.35)" strokeWidth="1.5" fill="none" filter="url(#glow1)"/>
          <path d="M -80 300 Q 60 230 160 265 Q 250 295 310 240" stroke="rgba(60,120,255,0.25)" strokeWidth="1" fill="none" filter="url(#glow1)"/>
          <path d="M -40 260 Q 100 185 200 215 Q 290 248 360 205" stroke="rgba(30,80,200,0.20)" strokeWidth="0.8" fill="none"/>
          <path d="M 860 280 Q 720 200 620 240 Q 540 270 480 220" stroke="rgba(40,100,255,0.35)" strokeWidth="1.5" fill="none" filter="url(#glow1)"/>
          <path d="M 880 300 Q 740 230 640 265 Q 550 295 490 240" stroke="rgba(60,120,255,0.25)" strokeWidth="1" fill="none" filter="url(#glow1)"/>
          <path d="M 840 260 Q 700 185 600 215 Q 510 248 440 205" stroke="rgba(30,80,200,0.20)" strokeWidth="0.8" fill="none"/>
          <ellipse cx="60" cy="310" rx="100" ry="30" fill="rgba(30,80,255,0.08)" filter="url(#glow2)"/>
          <ellipse cx="740" cy="310" rx="100" ry="30" fill="rgba(30,80,255,0.08)" filter="url(#glow2)"/>
        </svg>
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center justify-center flex-1 w-full px-6"
        style={{ zIndex: 2, paddingTop: "6vh", paddingBottom: "12vh" }}>

        <div className="mb-6" data-testid="img-globe-logo" style={anim("scaleIn", "0.8s", "0.2s")}>
          <GlobeIcon animate={globeAnimate} />
        </div>

        {/* Title line 1 */}
        <div style={{ overflow: "hidden", ...anim("fadeUp", "0.75s", "0.85s") }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(3rem, 10vw, 5.5rem)",
            fontWeight: 400, color: "rgba(235,242,255,0.97)",
            letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.08, margin: 0,
          }} data-testid="text-wiki-title">THOSHAN&apos;S</h1>
        </div>

        {/* Title line 2 */}
        <div style={{ overflow: "hidden", marginBottom: "0.6rem", ...anim("fadeUp", "0.75s", "1.0s") }}>
          <h1 aria-hidden="true" style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(3rem, 10vw, 5.5rem)",
            fontWeight: 400, color: "rgba(235,242,255,0.97)",
            letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.08, margin: 0,
          }}>WIKI</h1>
        </div>

        <p className="mb-9 text-center" style={{
          fontFamily: "'Inter', sans-serif", fontSize: "1rem",
          color: "rgba(180,200,235,0.70)", letterSpacing: "0.02em",
          ...anim("fadeIn", "0.7s", "1.25s"),
        }} data-testid="text-wiki-subtitle">
          A personal knowledge base
        </p>

        <form onSubmit={handleSearch} className="w-full flex items-center"
          style={{
            maxWidth: "520px", background: "rgba(15,22,45,0.85)",
            border: "1px solid rgba(80,110,180,0.30)", borderRadius: "10px",
            overflow: "hidden", backdropFilter: "blur(8px)",
            ...anim("fadeUp", "0.65s", "1.45s"),
          }} data-testid="form-search">
          <div className="flex items-center flex-1 px-4 py-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="rgba(150,175,220,0.55)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0 }} aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 bg-transparent outline-none ml-3 py-3 text-sm"
              style={{ color: "rgba(200,220,255,0.85)", fontFamily: "'Inter', sans-serif" }}
              data-testid="input-search-articles"/>
          </div>
          <button type="submit" className="flex items-center gap-2 px-5 py-3 text-sm font-medium"
            style={{
              background: "hsl(222,65%,30%)", color: "rgba(220,235,255,0.95)",
              fontFamily: "'Inter', sans-serif",
              borderLeft: "1px solid rgba(80,110,180,0.30)",
              borderRadius: "0 9px 9px 0", letterSpacing: "0.02em", whiteSpace: "nowrap",
            }} data-testid="button-search-submit">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search
          </button>
        </form>

        <a href="#articles" className="mt-5 flex items-center gap-2"
          style={{
            color: "rgba(100,155,255,0.85)", fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem", letterSpacing: "0.01em", textDecoration: "none",
            ...anim("fadeIn", "0.6s", "1.7s"),
          }} data-testid="link-browse-articles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Browse all articles
        </a>
      </div>

      {/* Explore */}
      <div className="relative flex flex-col items-center pb-8 gap-3" style={{
        zIndex: 2, ...anim("fadeUp", "0.7s", "1.9s"),
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: "0.7rem",
          letterSpacing: "0.28em", textTransform: "uppercase",
          color: "rgba(140,165,210,0.55)",
        }} data-testid="text-explore-label">EXPLORE</span>
        <button aria-label="Scroll down to explore"
          style={{
            width: "44px", height: "44px", borderRadius: "50%",
            border: "1px solid rgba(100,140,220,0.35)",
            background: "rgba(20,35,70,0.55)", backdropFilter: "blur(6px)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 18px rgba(60,100,255,0.18), 0 2px 8px rgba(0,0,0,0.4)",
            animation: phase === "done"
              ? "pulsate 3s ease-in-out infinite, bobble 2.5s ease-in-out infinite"
              : undefined,
          }} data-testid="button-explore-scroll">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="rgba(160,195,255,0.80)" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div aria-hidden="true" style={{
          width: "60px", height: "8px", borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(80,130,255,0.35) 0%, transparent 70%)",
          marginTop: "-2px",
        }}/>
      </div>
    </div>
  );
}

/* ─── Root with loader gate ──────────────────────────────────────────────── */
function AppRoot() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <StyleInjector />

      {/* Loading screen sits on top until done */}
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}

      {/* Home is always mounted (star canvas stays alive), just invisible under loader */}
      <div style={{
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.5s ease 0.1s",
        pointerEvents: loaded ? "auto" : "none",
      }}>
        <Home />
      </div>
    </div>
  );
}

/* ─── Router + shell ─────────────────────────────────────────────────────── */
function Router() {
  return (
    <Switch>
      <Route path="/" component={AppRoot} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
