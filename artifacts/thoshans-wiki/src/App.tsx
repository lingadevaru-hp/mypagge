import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function StarCanvas() {
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

    // Constellation dots (brighter, larger)
    const constellationDots = [
      { x: 0.12, y: 0.22 },
      { x: 0.38, y: 0.08 },
      { x: 0.65, y: 0.18 },
      { x: 0.88, y: 0.12 },
      { x: 0.82, y: 0.35 },
      { x: 0.25, y: 0.45 },
      { x: 0.72, y: 0.52 },
      { x: 0.45, y: 0.75 },
      { x: 0.15, y: 0.68 },
      { x: 0.92, y: 0.70 },
      { x: 0.58, y: 0.88 },
    ];

    const connections = [
      [0, 1], [1, 2], [2, 4], [4, 6], [3, 4], [5, 8], [6, 9], [7, 10]
    ];

    let animId: number;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.005;

      // Draw twinkling stars
      stars.forEach((s) => {
        const flicker = Math.sin(t * 20 * s.speed + s.x) * 0.15;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${Math.max(0, s.alpha + flicker)})`;
        ctx.fill();
      });

      // Draw constellation lines
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

      // Draw constellation dots
      constellationDots.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x * canvas.width, d.y * canvas.height, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(120, 170, 255, 0.6)";
        ctx.fill();

        // Glow
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
      style={{ zIndex: 0 }}
    />
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="90"
      height="90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer circle */}
      <circle cx="50" cy="50" r="44" stroke="rgba(200,220,255,0.35)" strokeWidth="1.2" />

      {/* Vertical ellipses (longitude lines) */}
      <ellipse cx="50" cy="50" rx="20" ry="44" stroke="rgba(200,220,255,0.28)" strokeWidth="1.2" />
      <ellipse cx="50" cy="50" rx="38" ry="44" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" />

      {/* Horizontal ellipses (latitude lines) */}
      <ellipse cx="50" cy="50" rx="44" ry="16" stroke="rgba(200,220,255,0.28)" strokeWidth="1.2" />
      <ellipse cx="50" cy="32" rx="34" ry="10" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" />
      <ellipse cx="50" cy="68" rx="34" ry="10" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" />

      {/* T letter in center */}
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="22"
        fontWeight="400"
        fill="rgba(220,235,255,0.90)"
        letterSpacing="1"
      >
        T
      </text>
    </svg>
  );
}

function Home() {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search placeholder — no backend
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden"
      style={{ background: "hsl(222, 47%, 5%)" }}
    >
      {/* Star field */}
      <StarCanvas />

      {/* Large orbit ring behind content */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -56%)",
          width: "520px",
          height: "520px",
          borderRadius: "50%",
          border: "1px solid rgba(160,190,255,0.09)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -56%)",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          border: "1px solid rgba(160,190,255,0.06)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Aurora / wave effects at bottom */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "320px",
          zIndex: 1,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox="0 0 800 320"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", bottom: 0, left: 0 }}
        >
          <defs>
            <filter id="glow1">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow2">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Left aurora waves */}
          <path
            d="M -60 280 Q 80 200 180 240 Q 260 270 320 220"
            stroke="rgba(40,100,255,0.35)"
            strokeWidth="1.5"
            fill="none"
            filter="url(#glow1)"
          />
          <path
            d="M -80 300 Q 60 230 160 265 Q 250 295 310 240"
            stroke="rgba(60,120,255,0.25)"
            strokeWidth="1"
            fill="none"
            filter="url(#glow1)"
          />
          <path
            d="M -40 260 Q 100 185 200 215 Q 290 248 360 205"
            stroke="rgba(30,80,200,0.20)"
            strokeWidth="0.8"
            fill="none"
          />

          {/* Right aurora waves */}
          <path
            d="M 860 280 Q 720 200 620 240 Q 540 270 480 220"
            stroke="rgba(40,100,255,0.35)"
            strokeWidth="1.5"
            fill="none"
            filter="url(#glow1)"
          />
          <path
            d="M 880 300 Q 740 230 640 265 Q 550 295 490 240"
            stroke="rgba(60,120,255,0.25)"
            strokeWidth="1"
            fill="none"
            filter="url(#glow1)"
          />
          <path
            d="M 840 260 Q 700 185 600 215 Q 510 248 440 205"
            stroke="rgba(30,80,200,0.20)"
            strokeWidth="0.8"
            fill="none"
          />

          {/* Bottom glow pool — left */}
          <ellipse
            cx="60"
            cy="310"
            rx="100"
            ry="30"
            fill="rgba(30,80,255,0.08)"
            filter="url(#glow2)"
          />
          {/* Bottom glow pool — right */}
          <ellipse
            cx="740"
            cy="310"
            rx="100"
            ry="30"
            fill="rgba(30,80,255,0.08)"
            filter="url(#glow2)"
          />
        </svg>
      </div>

      {/* Main content — vertically centered */}
      <div
        className="relative flex flex-col items-center justify-center flex-1 w-full px-6"
        style={{ zIndex: 2, paddingTop: "6vh", paddingBottom: "12vh" }}
      >
        {/* Globe logo */}
        <div className="mb-6" data-testid="img-globe-logo">
          <GlobeIcon />
        </div>

        {/* Title */}
        <h1
          className="text-center font-serif leading-none tracking-widest mb-3"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(3rem, 10vw, 5.5rem)",
            fontWeight: 400,
            color: "rgba(235, 242, 255, 0.97)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            lineHeight: 1.05,
          }}
          data-testid="text-wiki-title"
        >
          THOSHAN&apos;S
          <br />
          WIKI
        </h1>

        {/* Subtitle */}
        <p
          className="mb-9 text-center"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1rem",
            color: "rgba(180, 200, 235, 0.70)",
            letterSpacing: "0.02em",
          }}
          data-testid="text-wiki-subtitle"
        >
          A personal knowledge base
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="w-full flex items-center"
          style={{
            maxWidth: "520px",
            background: "rgba(15, 22, 45, 0.85)",
            border: "1px solid rgba(80, 110, 180, 0.30)",
            borderRadius: "10px",
            overflow: "hidden",
            backdropFilter: "blur(8px)",
          }}
          data-testid="form-search"
        >
          <div className="flex items-center flex-1 px-4 py-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(150,175,220,0.55)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 bg-transparent outline-none ml-3 py-3 text-sm"
              style={{
                color: "rgba(200, 220, 255, 0.85)",
                fontFamily: "'Inter', sans-serif",
              }}
              data-testid="input-search-articles"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              background: "hsl(222, 65%, 30%)",
              color: "rgba(220, 235, 255, 0.95)",
              fontFamily: "'Inter', sans-serif",
              borderLeft: "1px solid rgba(80, 110, 180, 0.30)",
              borderRadius: "0 9px 9px 0",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
            data-testid="button-search-submit"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search
          </button>
        </form>

        {/* Browse all articles */}
        <a
          href="#articles"
          className="mt-5 flex items-center gap-2 transition-opacity hover:opacity-80"
          style={{
            color: "rgba(100, 155, 255, 0.85)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem",
            letterSpacing: "0.01em",
            textDecoration: "none",
          }}
          data-testid="link-browse-articles"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Browse all articles
        </a>
      </div>

      {/* Explore section at bottom */}
      <div
        className="relative flex flex-col items-center pb-8 gap-3"
        style={{ zIndex: 2 }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(140, 165, 210, 0.55)",
          }}
          data-testid="text-explore-label"
        >
          EXPLORE
        </span>
        <button
          aria-label="Scroll down to explore"
          className="flex items-center justify-center transition-opacity hover:opacity-80"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "1px solid rgba(100, 140, 220, 0.35)",
            background: "rgba(20, 35, 70, 0.55)",
            backdropFilter: "blur(6px)",
            boxShadow: "0 0 18px rgba(60, 100, 255, 0.18), 0 2px 8px rgba(0,0,0,0.4)",
            cursor: "pointer",
          }}
          data-testid="button-explore-scroll"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(160,195,255,0.80)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {/* Glow beneath button */}
        <div
          aria-hidden="true"
          style={{
            width: "60px",
            height: "8px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(80,130,255,0.35) 0%, transparent 70%)",
            marginTop: "-2px",
          }}
        />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
