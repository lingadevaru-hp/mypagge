import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const KEYFRAMES = `
@keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes scaleIn  { from{opacity:0;transform:scale(0.55)} to{opacity:1;transform:scale(1)} }
@keyframes orbitExp { from{opacity:0;transform:translate(-50%,-56%) scale(0.3)} to{opacity:1;transform:translate(-50%,-56%) scale(1)} }
@keyframes drawStroke{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes pulsate  { 0%,100%{box-shadow:0 0 18px rgba(60,100,255,0.18),0 2px 8px rgba(0,0,0,0.4)} 50%{box-shadow:0 0 32px rgba(80,130,255,0.42),0 2px 12px rgba(0,0,0,0.5)} }
@keyframes bobble   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
@keyframes glowPulse{ 0%,100%{filter:drop-shadow(0 0 6px rgba(100,160,255,0))} 50%{filter:drop-shadow(0 0 20px rgba(100,160,255,0.6))} }
@keyframes curtainLift{ 0%{opacity:1} 60%{opacity:1} 100%{opacity:0} }
`;

function StyleInjector() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
  return null;
}

function StarCanvas({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const ctx = c.getContext("2d")!;

    type S = { x: number; y: number; r: number; a: number; sp: number };
    const stars: S[] = Array.from({ length: 200 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 1.5 + 0.2, a: Math.random() * 0.7 + 0.15,
      sp: Math.random() * 0.003 + 0.001,
    }));

    const dots = [
      { x: 0.12, y: 0.22 }, { x: 0.38, y: 0.08 }, { x: 0.65, y: 0.18 },
      { x: 0.88, y: 0.12 }, { x: 0.82, y: 0.35 }, { x: 0.25, y: 0.45 },
      { x: 0.72, y: 0.52 }, { x: 0.45, y: 0.75 }, { x: 0.15, y: 0.68 },
      { x: 0.92, y: 0.70 }, { x: 0.58, y: 0.88 },
    ];
    const conns = [[0,1],[1,2],[2,4],[4,6],[3,4],[5,8],[6,9],[7,10]];

    let id = 0, t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height); t += 0.005;
      stars.forEach(s => {
        const fl = Math.sin(t * 20 * s.sp + s.x) * 0.15;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${Math.max(0, s.a + fl)})`; ctx.fill();
      });
      conns.forEach(([a, b]) => {
        const da = dots[a], db = dots[b];
        ctx.beginPath(); ctx.moveTo(da.x * c.width, da.y * c.height);
        ctx.lineTo(db.x * c.width, db.y * c.height);
        ctx.strokeStyle = "rgba(100,150,255,0.08)"; ctx.lineWidth = 0.5; ctx.stroke();
      });
      dots.forEach(d => {
        ctx.beginPath(); ctx.arc(d.x * c.width, d.y * c.height, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(120,170,255,0.6)"; ctx.fill();
        const g = ctx.createRadialGradient(d.x*c.width, d.y*c.height, 0, d.x*c.width, d.y*c.height, 8);
        g.addColorStop(0, "rgba(100,160,255,0.25)"); g.addColorStop(1, "rgba(100,160,255,0)");
        ctx.beginPath(); ctx.arc(d.x*c.width, d.y*c.height, 8, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas ref={ref} className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: visible ? 1 : 0, transition: "opacity 1.2s ease 0.4s" }}
    />
  );
}

function GlobeIcon({ animate }: { animate: boolean }) {
  const sp = (delay: string) => animate
    ? { strokeDasharray: "1", strokeDashoffset: 1, style: { animation: `drawStroke 1.4s cubic-bezier(0.4,0,0.2,1) ${delay} forwards` } as React.CSSProperties }
    : { strokeDasharray: "1", strokeDashoffset: 1 };

  return (
    <svg viewBox="0 0 100 100" width="90" height="90" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={animate ? { animation: "glowPulse 3s ease-in-out 2s infinite" } : undefined}
    >
      <circle cx="50" cy="50" r="44" stroke="rgba(200,220,255,0.35)" strokeWidth="1.2" pathLength={1} {...sp("0.1s")} />
      <ellipse cx="50" cy="50" rx="20" ry="44" stroke="rgba(200,220,255,0.28)" strokeWidth="1.2" pathLength={1} {...sp("0.25s")} />
      <ellipse cx="50" cy="50" rx="38" ry="44" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" pathLength={1} {...sp("0.4s")} />
      <ellipse cx="50" cy="50" rx="44" ry="16" stroke="rgba(200,220,255,0.28)" strokeWidth="1.2" pathLength={1} {...sp("0.55s")} />
      <ellipse cx="50" cy="32" rx="34" ry="10" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" pathLength={1} {...sp("0.7s")} />
      <ellipse cx="50" cy="68" rx="34" ry="10" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" pathLength={1} {...sp("0.85s")} />
      <text x="50" y="56" textAnchor="middle" fontFamily="Georgia,serif" fontSize="22"
        fontWeight="400" letterSpacing="1"
        style={animate
          ? { fill: "rgba(220,235,255,0.90)", opacity: 0, animation: "fadeIn 0.6s ease 0.9s forwards" }
          : { fill: "rgba(220,235,255,0.90)" }}>
        T
      </text>
    </svg>
  );
}

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"curtain" | "reveal" | "done">("curtain");
  const [animate, setAnimate] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const t1 = setTimeout(() => setAnimate(true), 50);
    const t2 = setTimeout(() => setPhase("reveal"), 200);
    const t3 = setTimeout(() => setPhase("done"), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const anim = (name: string, dur: string, delay: string): React.CSSProperties =>
    phase !== "curtain"
      ? { animation: `${name} ${dur} cubic-bezier(0.4,0,0.2,1) ${delay} both` }
      : { opacity: 0 };

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/wiki/search?q=${encodeURIComponent(query)}`);
    } else {
      setLocation('/wiki/main-page');
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden"
      style={{ background: "hsl(222,47%,5%)" }}>

      <StyleInjector />

      {phase !== "done" && (
        <div aria-hidden="true" style={{
          position: "fixed", inset: 0,
          background: "hsl(222,50%,3%)",
          zIndex: 50, pointerEvents: "none",
          animation: "curtainLift 1.6s ease forwards",
        }} />
      )}

      <StarCanvas visible={phase !== "curtain"} />

      {(["520px", "360px"] as const).map((sz, i) => (
        <div key={sz} aria-hidden="true" style={{
          position: "absolute", top: "50%", left: "50%",
          width: sz, height: sz, borderRadius: "50%",
          border: `1px solid rgba(160,190,255,${i === 0 ? "0.09" : "0.06"})`,
          zIndex: 1, pointerEvents: "none",
          ...anim("orbitExp", "1.0s", `${0.5 + i * 0.15}s`),
        }} />
      ))}

      <div aria-hidden="true" style={{
        position: "absolute", bottom: 0, left: 0,
        width: "100%", height: "320px",
        zIndex: 1, pointerEvents: "none", overflow: "hidden",
        ...anim("fadeIn", "1.4s", "1.6s"),
      }}>
        <svg viewBox="0 0 800 320" preserveAspectRatio="none" width="100%" height="100%"
          xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", bottom: 0, left: 0 }}>
          <defs>
            <filter id="g1"><feGaussianBlur stdDeviation="4" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="g2"><feGaussianBlur stdDeviation="6" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <path d="M -60 280 Q 80 200 180 240 Q 260 270 320 220" stroke="rgba(40,100,255,0.35)" strokeWidth="1.5" fill="none" filter="url(#g1)"/>
          <path d="M -80 300 Q 60 230 160 265 Q 250 295 310 240" stroke="rgba(60,120,255,0.25)" strokeWidth="1" fill="none" filter="url(#g1)"/>
          <path d="M -40 260 Q 100 185 200 215 Q 290 248 360 205" stroke="rgba(30,80,200,0.20)" strokeWidth="0.8" fill="none"/>
          <path d="M 860 280 Q 720 200 620 240 Q 540 270 480 220" stroke="rgba(40,100,255,0.35)" strokeWidth="1.5" fill="none" filter="url(#g1)"/>
          <path d="M 880 300 Q 740 230 640 265 Q 550 295 490 240" stroke="rgba(60,120,255,0.25)" strokeWidth="1" fill="none" filter="url(#g1)"/>
          <path d="M 840 260 Q 700 185 600 215 Q 510 248 440 205" stroke="rgba(30,80,200,0.20)" strokeWidth="0.8" fill="none"/>
          <ellipse cx="60" cy="310" rx="100" ry="30" fill="rgba(30,80,255,0.08)" filter="url(#g2)"/>
          <ellipse cx="740" cy="310" rx="100" ry="30" fill="rgba(30,80,255,0.08)" filter="url(#g2)"/>
        </svg>
      </div>

      <div className="relative flex flex-col items-center justify-center flex-1 w-full px-6"
        style={{ zIndex: 2, paddingTop: "6vh", paddingBottom: "12vh" }}>

        <div className="mb-6" data-testid="img-globe-logo" style={anim("scaleIn", "0.8s", "0.2s")}>
          <GlobeIcon animate={animate} />
        </div>

        <div style={{ overflow: "hidden", ...anim("fadeUp", "0.75s", "0.85s") }}>
          <h1 style={{
            fontFamily: "'Playfair Display',Georgia,serif",
            fontSize: "clamp(3rem,10vw,5.5rem)", fontWeight: 400,
            color: "rgba(235,242,255,0.97)", letterSpacing: "0.12em",
            textTransform: "uppercase", lineHeight: 1.08, margin: 0,
          }} data-testid="text-wiki-title">THOSHAN&apos;S</h1>
        </div>

        <div style={{ overflow: "hidden", marginBottom: "0.6rem", ...anim("fadeUp", "0.75s", "1.0s") }}>
          <h1 aria-hidden="true" style={{
            fontFamily: "'Playfair Display',Georgia,serif",
            fontSize: "clamp(3rem,10vw,5.5rem)", fontWeight: 400,
            color: "rgba(235,242,255,0.97)", letterSpacing: "0.12em",
            textTransform: "uppercase", lineHeight: 1.08, margin: 0,
          }}>WIKI</h1>
        </div>

        <p className="mb-9 text-center" style={{
          fontFamily: "'Inter',sans-serif", fontSize: "1rem",
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
            <input type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 bg-transparent outline-none ml-3 py-3 text-sm"
              style={{ color: "rgba(200,220,255,0.85)", fontFamily: "'Inter',sans-serif" }}
              data-testid="input-search-articles" />
          </div>
          <button type="submit" className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              background: "hsl(222,65%,30%)", color: "rgba(220,235,255,0.95)",
              fontFamily: "'Inter',sans-serif",
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

        <a href="/wiki/main-page" className="mt-5 flex items-center gap-2 transition-opacity hover:opacity-80"
          style={{
            color: "rgba(100,155,255,0.85)", fontFamily: "'Inter',sans-serif",
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

      <div className="relative flex flex-col items-center pb-8 gap-3"
        style={{ zIndex: 2, ...anim("fadeUp", "0.7s", "1.9s") }}>
        <span style={{
          fontFamily: "'Inter',sans-serif", fontSize: "0.7rem",
          letterSpacing: "0.28em", textTransform: "uppercase",
          color: "rgba(140,165,210,0.55)",
        }} data-testid="text-explore-label">EXPLORE</span>
        <button aria-label="Go to wiki main page"
          onClick={() => setLocation('/wiki/main-page')}
          className="flex items-center justify-center transition-opacity hover:opacity-80"
          style={{
            width: "44px", height: "44px", borderRadius: "50%",
            border: "1px solid rgba(100,140,220,0.35)",
            background: "rgba(20,35,70,0.55)", backdropFilter: "blur(6px)", cursor: "pointer",
            boxShadow: "0 0 18px rgba(60,100,255,0.18),0 2px 8px rgba(0,0,0,0.4)",
            animation: phase === "done"
              ? "pulsate 3s ease-in-out infinite,bobble 2.5s ease-in-out infinite"
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
          background: "radial-gradient(ellipse,rgba(80,130,255,0.35) 0%,transparent 70%)",
          marginTop: "-2px",
        }} />
      </div>
    </div>
  );
}
