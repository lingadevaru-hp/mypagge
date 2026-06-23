import { useEffect, useRef, useState, useCallback } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

/* ─────────────────────────────────────────────
   INJECTED GLOBAL KEYFRAMES
───────────────────────────────────────────── */
const KEYFRAMES = `
@keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes scaleIn  { from{opacity:0;transform:scale(0.55)} to{opacity:1;transform:scale(1)} }
@keyframes orbitExp { from{opacity:0;transform:translate(-50%,-56%) scale(0.3)} to{opacity:1;transform:translate(-50%,-56%) scale(1)} }
@keyframes drawStroke{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes pulsate  { 0%,100%{box-shadow:0 0 18px rgba(60,100,255,0.18),0 2px 8px rgba(0,0,0,0.4)} 50%{box-shadow:0 0 32px rgba(80,130,255,0.42),0 2px 12px rgba(0,0,0,0.5)} }
@keyframes bobble   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
@keyframes glowPulse{ 0%,100%{filter:drop-shadow(0 0 6px rgba(100,160,255,0))} 50%{filter:drop-shadow(0 0 20px rgba(100,160,255,0.6))} }
@keyframes loaderOut{ from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.08)} }
@keyframes loaderIn { from{opacity:0} to{opacity:1} }
@keyframes ringPing { 0%{transform:scale(0.7);opacity:0.8} 100%{transform:scale(2.2);opacity:0} }
@keyframes scanLine { 0%{top:10%} 100%{top:90%} }
@keyframes dataBlink{ 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes slideInLeft { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideInRight{ from{opacity:0;transform:translateX(30px)}  to{opacity:1;transform:translateX(0)} }
@keyframes progressFill{ from{width:0%} to{width:100%} }
@keyframes floatLabel { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes rotateOrbit{ from{transform:rotateZ(0deg)} to{transform:rotateZ(360deg)} }
@keyframes rotateOrbit2{ from{transform:rotateY(0deg) rotateX(60deg)} to{transform:rotateY(360deg) rotateX(60deg)} }
@keyframes hexPulse { 0%,100%{opacity:0.06} 50%{opacity:0.18} }
@keyframes cornerBlink{ 0%,100%{opacity:0.9} 50%{opacity:0.3} }
@keyframes textCycle { 0%{opacity:0;transform:translateY(8px)} 15%{opacity:1;transform:translateY(0)} 80%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-8px)} }
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

/* ─────────────────────────────────────────────
   SPINNING 3D GLOBE  (full-size canvas)
───────────────────────────────────────────── */
function Globe3D({ size }: { size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr; c.height = size * dpr;
    c.style.width = `${size}px`; c.style.height = `${size}px`;
    const ctx = c.getContext("2d")!; ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, R = size * 0.40;
    let angle = 0;

    const proj = (lat: number, lon: number): [number, number, number] => {
      const phi = (lat * Math.PI) / 180;
      const theta = (lon * Math.PI) / 180 + angle;
      return [
        cx + Math.cos(phi) * Math.sin(theta) * R,
        cy - Math.sin(phi) * R,
        Math.cos(phi) * Math.cos(theta),
      ];
    };

    const drawArc = (
      points: Array<[number, number, number]>,
      strokeFn: (z: number) => string,
      lw: number
    ) => {
      let open = false;
      ctx.beginPath();
      points.forEach(([px, py, z], i) => {
        if (z > -0.05) {
          if (!open) { ctx.moveTo(px, py); open = true; }
          else ctx.lineTo(px, py);
        } else { open = false; if (i > 0) ctx.stroke(); ctx.beginPath(); }
      });
      ctx.strokeStyle = strokeFn(0);
      ctx.lineWidth = lw;
      ctx.stroke();
    };

    const tick = () => {
      ctx.clearRect(0, 0, size, size);
      angle += 0.006;

      // Glow backdrop
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.3);
      bg.addColorStop(0, "rgba(30,70,180,0.07)");
      bg.addColorStop(0.7, "rgba(20,50,140,0.04)");
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = bg; ctx.fill();

      // Latitude lines
      const lats = [-80,-70,-60,-50,-40,-30,-20,-10,0,10,20,30,40,50,60,70,80];
      lats.forEach(lat => {
        const pts = Array.from({length:121},(_,i)=>proj(lat,(i/120)*360-180));
        const isEq = lat===0;
        drawArc(pts, () => isEq ? "rgba(100,180,255,0.50)" : "rgba(70,140,230,0.22)", isEq?1.4:0.7);
      });

      // Longitude lines
      const lons = Array.from({length:24},(_,i)=>i*15-180);
      lons.forEach(lon => {
        const pts = Array.from({length:91},(_,i)=>proj((i/90)*180-90,lon));
        const isPrime = lon===0||lon===180||lon===-180;
        drawArc(pts, () => isPrime?"rgba(100,180,255,0.45)":"rgba(70,140,230,0.18)", isPrime?1.2:0.6);
      });

      // Bright rim
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(100,170,255,0.55)"; ctx.lineWidth = 1.4; ctx.stroke();

      // Outer glow halo
      const halo = ctx.createRadialGradient(cx,cy,R*0.9,cx,cy,R*1.12);
      halo.addColorStop(0,"rgba(80,150,255,0)");
      halo.addColorStop(0.6,"rgba(80,150,255,0.18)");
      halo.addColorStop(1,"rgba(80,150,255,0)");
      ctx.beginPath(); ctx.arc(cx,cy,R*1.05,0,Math.PI*2);
      ctx.strokeStyle=halo; ctx.lineWidth=10; ctx.stroke();

      // Highlight spot (top-left shine)
      const shine = ctx.createRadialGradient(cx-R*0.28,cy-R*0.28,0,cx-R*0.28,cy-R*0.28,R*0.45);
      shine.addColorStop(0,"rgba(180,220,255,0.12)");
      shine.addColorStop(1,"rgba(180,220,255,0)");
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
      ctx.fillStyle=shine; ctx.fill();

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [size]);

  return <canvas ref={ref} style={{display:"block"}} />;
}

/* ─────────────────────────────────────────────
   COORDINATE LABEL (floating around globe)
───────────────────────────────────────────── */
function CoordLabel({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontFamily:"'Inter',monospace", fontSize:"0.62rem", letterSpacing:"0.12em",
      color:"rgba(100,180,255,0.70)", whiteSpace:"nowrap",
      animation:"floatLabel 3s ease-in-out infinite",
      ...style,
    }}>
      {text}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DATA READOUT PANEL (left / right sides)
───────────────────────────────────────────── */
function DataPanel({ side }: { side: "left"|"right" }) {
  const rows = side === "left" ? [
    ["LAT","06°52′N"],["LON","79°51′E"],["ALT","35,786 km"],
    ["NODE","TW-01"],["STATUS","ACTIVE"],["SYNC","99.98%"],
    ["PACKETS","18,432"],["UPTIME","99.91%"],
  ] : [
    ["ORBIT","GEO"],["PERIOD","24.0 hr"],["INCL","0.07°"],
    ["VEL","3.07 km/s"],["SIGNAL","−97 dBm"],["BIT RATE","150 Mbps"],
    ["ARTICLES","4,821"],["INDEX","LIVE"],
  ];

  return (
    <div style={{
      display:"flex", flexDirection:"column", gap:"10px",
      animation:`${side==="left"?"slideInLeft":"slideInRight"} 0.6s ease 0.4s both`,
    }}>
      {/* header */}
      <div style={{
        fontFamily:"'Inter',monospace", fontSize:"0.58rem", letterSpacing:"0.22em",
        color:"rgba(100,180,255,0.45)", marginBottom:"4px",
        borderBottom:"1px solid rgba(80,140,255,0.18)", paddingBottom:"6px",
      }}>
        {side==="left" ? "◈  GEO-POSITION" : "◈  ORBIT-DATA"}
      </div>
      {rows.map(([label, val]) => (
        <div key={label} style={{display:"flex", justifyContent:"space-between", gap:"24px"}}>
          <span style={{fontFamily:"'Inter',monospace",fontSize:"0.58rem",color:"rgba(120,160,220,0.50)",letterSpacing:"0.1em"}}>{label}</span>
          <span style={{fontFamily:"'Inter',monospace",fontSize:"0.60rem",color:"rgba(160,210,255,0.85)",letterSpacing:"0.08em",
            animation: label==="SYNC"||label==="STATUS"||label==="INDEX" ? "dataBlink 1.8s ease-in-out infinite" : undefined,
          }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CORNER DECORATION
───────────────────────────────────────────── */
function Corner({ pos }: { pos: "tl"|"tr"|"bl"|"br" }) {
  const size = 22;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      style={{ position:"absolute",
        top: pos.includes("t") ? 8 : undefined,
        bottom: pos.includes("b") ? 8 : undefined,
        left: pos.includes("l") ? 8 : undefined,
        right: pos.includes("r") ? 8 : undefined,
        animation:"cornerBlink 2.2s ease-in-out infinite",
      }}>
      {pos==="tl" && <><path d={`M0 ${size} L0 0 L${size} 0`} stroke="rgba(100,180,255,0.55)" strokeWidth="1.5"/></>}
      {pos==="tr" && <><path d={`M0 0 L${size} 0 L${size} ${size}`} stroke="rgba(100,180,255,0.55)" strokeWidth="1.5"/></>}
      {pos==="bl" && <><path d={`M0 0 L0 ${size} L${size} ${size}`} stroke="rgba(100,180,255,0.55)" strokeWidth="1.5"/></>}
      {pos==="br" && <><path d={`M${size} 0 L${size} ${size} L0 ${size}`} stroke="rgba(100,180,255,0.55)" strokeWidth="1.5"/></>}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   STAR PARTICLE FIELD  (canvas)
───────────────────────────────────────────── */
function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const resize = () => { c.width=window.innerWidth; c.height=window.innerHeight; };
    resize(); window.addEventListener("resize",resize);
    const ctx = c.getContext("2d")!;
    type S={x:number;y:number;r:number;a:number;sp:number};
    const stars: S[] = Array.from({length:280},()=>({
      x:Math.random()*c.width, y:Math.random()*c.height,
      r:Math.random()*1.4+0.2, a:Math.random()*0.7+0.1, sp:Math.random()*0.003+0.001,
    }));
    let t=0, id=0;
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height); t+=0.005;
      stars.forEach(s=>{
        const fl=Math.sin(t*18*s.sp+s.x)*0.12;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(200,220,255,${Math.max(0,s.a+fl)})`; ctx.fill();
      });
      id=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{ cancelAnimationFrame(id); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

/* ─────────────────────────────────────────────
   LOADING  SCREEN
───────────────────────────────────────────── */
const STATUS_LINES = [
  "INITIALIZING KNOWLEDGE MATRIX...",
  "CONNECTING TO SATELLITE NODE...",
  "SYNCING ARTICLE DATABASE...",
  "CALIBRATING SEARCH INDEX...",
  "ESTABLISHING SECURE LINK...",
  "LOADING THOSHAN'S WIKI...",
];

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [globeSize, setGlobeSize] = useState(340);
  const [ping, setPing] = useState(0);

  useEffect(() => {
    const updateSize = () =>
      setGlobeSize(Math.min(Math.min(window.innerWidth, window.innerHeight) * 0.48, 380));
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Progress bar
  useEffect(() => {
    const dur = 2600; const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now()-start)/dur)*100);
      setProgress(p);
      if (p>=100) clearInterval(id);
    }, 30);
    return ()=>clearInterval(id);
  }, []);

  // Status text cycling
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++; setStatusIdx(Math.min(i, STATUS_LINES.length-1));
      if (i >= STATUS_LINES.length-1) clearInterval(id);
    }, 430);
    return ()=>clearInterval(id);
  }, []);

  // Ping pulse
  useEffect(() => {
    const id = setInterval(()=>setPing(p=>p+1), 1200);
    return ()=>clearInterval(id);
  }, []);

  // Exit
  useEffect(()=>{
    const t1=setTimeout(()=>setExiting(true), 2800);
    const t2=setTimeout(onDone, 3550);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[onDone]);

  const pingKeys = [ping-2,ping-1,ping].filter(k=>k>=0);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:100,
      background:"hsl(222,52%,4%)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      overflow:"hidden",
      animation: exiting
        ? "loaderOut 0.75s cubic-bezier(0.4,0,0.2,1) forwards"
        : "loaderIn 0.45s ease forwards",
    }}>
      <StyleInjector />
      <StarField />

      {/* Corner decorations */}
      <Corner pos="tl"/><Corner pos="tr"/><Corner pos="bl"/><Corner pos="br"/>

      {/* Top bar */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"1px",
        background:"linear-gradient(90deg,transparent,rgba(80,150,255,0.6),transparent)",
      }}/>

      {/* Scan line across whole screen */}
      <div style={{
        position:"absolute", left:0, right:0, height:"1px",
        background:"linear-gradient(90deg,transparent,rgba(80,160,255,0.25),rgba(120,200,255,0.45),rgba(80,160,255,0.25),transparent)",
        animation:"scanLine 3.2s linear infinite",
        zIndex:2, pointerEvents:"none",
      }}/>

      {/* Header label */}
      <div style={{
        position:"absolute", top:"24px", left:"50%", transform:"translateX(-50%)",
        fontFamily:"'Inter',monospace", fontSize:"0.65rem", letterSpacing:"0.4em",
        color:"rgba(100,180,255,0.50)", animation:"fadeIn 0.6s ease 0.2s both",
        zIndex:5,
      }}>
        ◈ &nbsp; THOSHAN — WIKI &nbsp; ◈
      </div>

      {/* Main row: panel + globe + panel */}
      <div style={{
        position:"relative", zIndex:5,
        display:"flex", alignItems:"center", justifyContent:"center",
        gap:"clamp(16px,3vw,48px)", width:"100%", maxWidth:"1000px", padding:"0 24px",
      }}>

        {/* Left panel */}
        <div style={{flex:"0 0 160px", display:"flex", flexDirection:"column", gap:"0"}}>
          <DataPanel side="left"/>
        </div>

        {/* Globe stage */}
        <div style={{position:"relative", flexShrink:0}}>

          {/* Ping rings */}
          {pingKeys.map(k=>(
            <div key={k} style={{
              position:"absolute",
              top:"50%", left:"50%",
              width:`${globeSize*0.82}px`, height:`${globeSize*0.82}px`,
              marginTop:`-${globeSize*0.41}px`, marginLeft:`-${globeSize*0.41}px`,
              borderRadius:"50%",
              border:"1px solid rgba(80,160,255,0.45)",
              animation:"ringPing 1.2s ease-out forwards",
              pointerEvents:"none", zIndex:0,
            }}/>
          ))}

          {/* Orbit ring 1 — around globe */}
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            width:`${globeSize*1.25}px`, height:`${globeSize*1.25}px`,
            marginTop:`-${globeSize*0.625}px`, marginLeft:`-${globeSize*0.625}px`,
            borderRadius:"50%",
            border:"1px solid rgba(80,140,255,0.20)",
            animation:"rotateOrbit 12s linear infinite",
            pointerEvents:"none", zIndex:1,
          }}>
            {/* Dot on orbit */}
            <div style={{
              position:"absolute", top:"-4px", left:"50%", marginLeft:"-4px",
              width:"8px", height:"8px", borderRadius:"50%",
              background:"rgba(120,200,255,0.9)",
              boxShadow:"0 0 10px rgba(120,200,255,0.8), 0 0 4px rgba(120,200,255,1)",
            }}/>
          </div>

          {/* Orbit ring 2 — tilted */}
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            width:`${globeSize*1.1}px`, height:`${globeSize*1.1}px`,
            marginTop:`-${globeSize*0.55}px`, marginLeft:`-${globeSize*0.55}px`,
            borderRadius:"50%",
            border:"1px solid rgba(60,120,220,0.18)",
            transform:"rotateX(70deg)",
            animation:"rotateOrbit 18s linear infinite reverse",
            pointerEvents:"none", zIndex:1,
          }}>
            <div style={{
              position:"absolute", bottom:"-3px", left:"50%", marginLeft:"-3px",
              width:"6px", height:"6px", borderRadius:"50%",
              background:"rgba(200,150,255,0.9)",
              boxShadow:"0 0 8px rgba(200,150,255,0.8)",
            }}/>
          </div>

          {/* Globe itself */}
          <div style={{
            position:"relative", zIndex:2,
            filter:"drop-shadow(0 0 40px rgba(60,130,255,0.28))",
          }}>
            <Globe3D size={globeSize}/>
          </div>

          {/* Floating coord labels */}
          <CoordLabel text="06°52′N · 79°51′E" style={{
            position:"absolute", top:"-28px", left:"50%", transform:"translateX(-50%)",
            animation:"floatLabel 3.2s ease-in-out infinite, fadeIn 0.5s ease 0.8s both",
            zIndex:3,
          }}/>
          <CoordLabel text="GEO · 35,786 km" style={{
            position:"absolute", bottom:"-28px", left:"50%", transform:"translateX(-50%)",
            animation:"floatLabel 2.8s ease-in-out 0.4s infinite, fadeIn 0.5s ease 1.0s both",
            zIndex:3,
          }}/>
          <CoordLabel text="NODE TW-01" style={{
            position:"absolute", top:"50%", left:`-${globeSize*0.18}px`,
            transform:"translateY(-50%)",
            animation:"floatLabel 3.6s ease-in-out 0.2s infinite, fadeIn 0.5s ease 1.1s both",
            zIndex:3,
          }}/>
          <CoordLabel text="UPLINK ✓" style={{
            position:"absolute", top:"50%", right:`-${globeSize*0.18}px`,
            transform:"translateY(-50%)",
            animation:"floatLabel 3.0s ease-in-out 0.6s infinite, fadeIn 0.5s ease 1.2s both",
            zIndex:3,
          }}/>

          {/* Crosshair on globe */}
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            width:`${globeSize*0.12}px`, height:`${globeSize*0.12}px`,
            zIndex:3, pointerEvents:"none",
          }}>
            <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none">
              <line x1="20" y1="0" x2="20" y2="14" stroke="rgba(100,200,255,0.6)" strokeWidth="1"/>
              <line x1="20" y1="26" x2="20" y2="40" stroke="rgba(100,200,255,0.6)" strokeWidth="1"/>
              <line x1="0" y1="20" x2="14" y2="20" stroke="rgba(100,200,255,0.6)" strokeWidth="1"/>
              <line x1="26" y1="20" x2="40" y2="20" stroke="rgba(100,200,255,0.6)" strokeWidth="1"/>
              <circle cx="20" cy="20" r="4" stroke="rgba(100,200,255,0.7)" strokeWidth="1"/>
            </svg>
          </div>
        </div>

        {/* Right panel */}
        <div style={{flex:"0 0 160px"}}>
          <DataPanel side="right"/>
        </div>
      </div>

      {/* Status + progress at bottom */}
      <div style={{
        position:"absolute", bottom:"48px", left:"50%", transform:"translateX(-50%)",
        display:"flex", flexDirection:"column", alignItems:"center", gap:"14px",
        width:"min(480px, 85vw)", zIndex:5,
        animation:"fadeIn 0.5s ease 0.3s both",
      }}>
        {/* Status text */}
        <div style={{
          fontFamily:"'Inter',monospace", fontSize:"0.65rem", letterSpacing:"0.22em",
          color:"rgba(120,180,255,0.70)", height:"18px", overflow:"hidden",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <span key={statusIdx} style={{animation:"textCycle 0.45s ease both"}}>
            {STATUS_LINES[statusIdx]}
          </span>
        </div>

        {/* Progress bar track */}
        <div style={{
          width:"100%", height:"2px",
          background:"rgba(60,100,200,0.18)",
          borderRadius:"2px", overflow:"hidden", position:"relative",
        }}>
          <div style={{
            height:"100%",
            background:"linear-gradient(90deg,rgba(60,120,255,0.7),rgba(120,200,255,1),rgba(60,120,255,0.7))",
            boxShadow:"0 0 10px rgba(100,180,255,0.6)",
            borderRadius:"2px",
            transition:"width 0.1s linear",
            width:`${progress}%`,
          }}/>
          {/* Shimmer */}
          <div style={{
            position:"absolute", top:0, bottom:0,
            width:"40px",
            background:"linear-gradient(90deg,transparent,rgba(200,230,255,0.5),transparent)",
            left:`calc(${progress}% - 20px)`,
            transition:"left 0.1s linear",
          }}/>
        </div>

        {/* Percentage + bar labels */}
        <div style={{
          display:"flex", justifyContent:"space-between", width:"100%",
          fontFamily:"'Inter',monospace", fontSize:"0.56rem", letterSpacing:"0.15em",
          color:"rgba(80,140,220,0.45)",
        }}>
          <span>SYS://BOOT</span>
          <span style={{color:"rgba(120,190,255,0.75)", animation:"dataBlink 0.9s ease-in-out infinite"}}>
            {Math.round(progress).toString().padStart(3,"0")} %
          </span>
          <span>NODE://ACTIVE</span>
        </div>
      </div>

      {/* Decorative horizontal rule lines */}
      {[0.25, 0.75].map(x=>(
        <div key={x} style={{
          position:"absolute", top:0, bottom:0,
          left:`${x*100}%`, width:"1px",
          background:`linear-gradient(180deg,transparent,rgba(80,140,255,0.10),transparent)`,
          zIndex:1, pointerEvents:"none",
        }}/>
      ))}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, height:"1px",
        background:"linear-gradient(90deg,transparent,rgba(80,150,255,0.4),transparent)",
      }}/>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────────── */
function StarCanvas({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    resize(); window.addEventListener("resize",resize);
    const ctx=c.getContext("2d")!;
    type S={x:number;y:number;r:number;a:number;sp:number};
    const stars:S[]=Array.from({length:200},()=>({
      x:Math.random()*c.width,y:Math.random()*c.height,
      r:Math.random()*1.5+0.2,a:Math.random()*0.7+0.15,sp:Math.random()*0.003+0.001,
    }));
    const dots=[
      {x:0.12,y:0.22},{x:0.38,y:0.08},{x:0.65,y:0.18},{x:0.88,y:0.12},
      {x:0.82,y:0.35},{x:0.25,y:0.45},{x:0.72,y:0.52},{x:0.45,y:0.75},
      {x:0.15,y:0.68},{x:0.92,y:0.70},{x:0.58,y:0.88},
    ];
    const conns=[[0,1],[1,2],[2,4],[4,6],[3,4],[5,8],[6,9],[7,10]];
    let id=0,t=0;
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height); t+=0.005;
      stars.forEach(s=>{
        const fl=Math.sin(t*20*s.sp+s.x)*0.15;
        ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(200,220,255,${Math.max(0,s.a+fl)})`;ctx.fill();
      });
      conns.forEach(([a,b])=>{
        const da=dots[a],db=dots[b];
        ctx.beginPath();ctx.moveTo(da.x*c.width,da.y*c.height);
        ctx.lineTo(db.x*c.width,db.y*c.height);
        ctx.strokeStyle="rgba(100,150,255,0.08)";ctx.lineWidth=0.5;ctx.stroke();
      });
      dots.forEach(d=>{
        ctx.beginPath();ctx.arc(d.x*c.width,d.y*c.height,2.5,0,Math.PI*2);
        ctx.fillStyle="rgba(120,170,255,0.6)";ctx.fill();
        const g=ctx.createRadialGradient(d.x*c.width,d.y*c.height,0,d.x*c.width,d.y*c.height,8);
        g.addColorStop(0,"rgba(100,160,255,0.25)");g.addColorStop(1,"rgba(100,160,255,0)");
        ctx.beginPath();ctx.arc(d.x*c.width,d.y*c.height,8,0,Math.PI*2);
        ctx.fillStyle=g;ctx.fill();
      });
      id=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(id);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none"
    style={{zIndex:0,opacity:visible?1:0,transition:"opacity 1s ease 0.3s"}}/>;
}

function GlobeIcon({ animate }: { animate: boolean }) {
  const sp=(d:string)=>animate?{strokeDasharray:"1",strokeDashoffset:1,style:{animation:`drawStroke 1.4s cubic-bezier(0.4,0,0.2,1) ${d} forwards`} as React.CSSProperties}:{strokeDasharray:"1",strokeDashoffset:1};
  return (
    <svg viewBox="0 0 100 100" width="90" height="90" fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={animate?{animation:"glowPulse 3s ease-in-out 2s infinite"}:undefined}>
      <circle cx="50" cy="50" r="44" stroke="rgba(200,220,255,0.35)" strokeWidth="1.2" pathLength={1} {...sp("0.1s")}/>
      <ellipse cx="50" cy="50" rx="20" ry="44" stroke="rgba(200,220,255,0.28)" strokeWidth="1.2" pathLength={1} {...sp("0.25s")}/>
      <ellipse cx="50" cy="50" rx="38" ry="44" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" pathLength={1} {...sp("0.4s")}/>
      <ellipse cx="50" cy="50" rx="44" ry="16" stroke="rgba(200,220,255,0.28)" strokeWidth="1.2" pathLength={1} {...sp("0.55s")}/>
      <ellipse cx="50" cy="32" rx="34" ry="10" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" pathLength={1} {...sp("0.7s")}/>
      <ellipse cx="50" cy="68" rx="34" ry="10" stroke="rgba(200,220,255,0.18)" strokeWidth="0.8" pathLength={1} {...sp("0.85s")}/>
      <text x="50" y="56" textAnchor="middle" fontFamily="Georgia,serif" fontSize="22"
        fontWeight="400" letterSpacing="1"
        style={animate?{fill:"rgba(220,235,255,0.90)",opacity:0,animation:"fadeIn 0.6s ease 0.9s forwards"}:{fill:"rgba(220,235,255,0.90)"}}>T</text>
    </svg>
  );
}

function Home() {
  const [query,setQuery]=useState("");
  const [phase,setPhase]=useState<"hidden"|"reveal"|"done">("hidden");
  const [globeAnim,setGlobeAnim]=useState(false);
  useEffect(()=>{
    const t1=setTimeout(()=>{setPhase("reveal");setGlobeAnim(true);},80);
    const t2=setTimeout(()=>setPhase("done"),3500);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);
  const anim=(name:string,dur:string,delay:string):React.CSSProperties=>
    phase!=="hidden"?{animation:`${name} ${dur} cubic-bezier(0.4,0,0.2,1) ${delay} both`}:{opacity:0};

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden"
      style={{background:"hsl(222,47%,5%)"}}>
      <StarCanvas visible={phase!=="hidden"}/>
      {(["520px","360px"] as const).map((sz,i)=>(
        <div key={sz} aria-hidden="true" style={{
          position:"absolute",top:"50%",left:"50%",width:sz,height:sz,borderRadius:"50%",
          border:`1px solid rgba(160,190,255,${i===0?"0.09":"0.06"})`,
          zIndex:1,pointerEvents:"none",
          ...anim("orbitExp","1.0s",`${0.5+i*0.15}s`),
        }}/>
      ))}
      <div aria-hidden="true" style={{position:"absolute",bottom:0,left:0,width:"100%",height:"320px",zIndex:1,pointerEvents:"none",overflow:"hidden",...anim("fadeIn","1.4s","1.6s")}}>
        <svg viewBox="0 0 800 320" preserveAspectRatio="none" width="100%" height="100%"
          xmlns="http://www.w3.org/2000/svg" style={{position:"absolute",bottom:0,left:0}}>
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
        style={{zIndex:2,paddingTop:"6vh",paddingBottom:"12vh"}}>
        <div className="mb-6" data-testid="img-globe-logo" style={anim("scaleIn","0.8s","0.2s")}>
          <GlobeIcon animate={globeAnim}/>
        </div>
        <div style={{overflow:"hidden",...anim("fadeUp","0.75s","0.85s")}}>
          <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"clamp(3rem,10vw,5.5rem)",fontWeight:400,color:"rgba(235,242,255,0.97)",letterSpacing:"0.12em",textTransform:"uppercase",lineHeight:1.08,margin:0}} data-testid="text-wiki-title">THOSHAN&apos;S</h1>
        </div>
        <div style={{overflow:"hidden",marginBottom:"0.6rem",...anim("fadeUp","0.75s","1.0s")}}>
          <h1 aria-hidden="true" style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"clamp(3rem,10vw,5.5rem)",fontWeight:400,color:"rgba(235,242,255,0.97)",letterSpacing:"0.12em",textTransform:"uppercase",lineHeight:1.08,margin:0}}>WIKI</h1>
        </div>
        <p className="mb-9 text-center" style={{fontFamily:"'Inter',sans-serif",fontSize:"1rem",color:"rgba(180,200,235,0.70)",letterSpacing:"0.02em",...anim("fadeIn","0.7s","1.25s")}} data-testid="text-wiki-subtitle">A personal knowledge base</p>
        <form onSubmit={e=>e.preventDefault()} className="w-full flex items-center"
          style={{maxWidth:"520px",background:"rgba(15,22,45,0.85)",border:"1px solid rgba(80,110,180,0.30)",borderRadius:"10px",overflow:"hidden",backdropFilter:"blur(8px)",...anim("fadeUp","0.65s","1.45s")}}
          data-testid="form-search">
          <div className="flex items-center flex-1 px-4 py-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(150,175,220,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}} aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search articles..."
              className="flex-1 bg-transparent outline-none ml-3 py-3 text-sm"
              style={{color:"rgba(200,220,255,0.85)",fontFamily:"'Inter',sans-serif"}}
              data-testid="input-search-articles"/>
          </div>
          <button type="submit" className="flex items-center gap-2 px-5 py-3 text-sm font-medium"
            style={{background:"hsl(222,65%,30%)",color:"rgba(220,235,255,0.95)",fontFamily:"'Inter',sans-serif",borderLeft:"1px solid rgba(80,110,180,0.30)",borderRadius:"0 9px 9px 0",letterSpacing:"0.02em",whiteSpace:"nowrap"}}
            data-testid="button-search-submit">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search
          </button>
        </form>
        <a href="#articles" className="mt-5 flex items-center gap-2"
          style={{color:"rgba(100,155,255,0.85)",fontFamily:"'Inter',sans-serif",fontSize:"0.875rem",letterSpacing:"0.01em",textDecoration:"none",...anim("fadeIn","0.6s","1.7s")}}
          data-testid="link-browse-articles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Browse all articles
        </a>
      </div>
      <div className="relative flex flex-col items-center pb-8 gap-3" style={{zIndex:2,...anim("fadeUp","0.7s","1.9s")}}>
        <span style={{fontFamily:"'Inter',sans-serif",fontSize:"0.7rem",letterSpacing:"0.28em",textTransform:"uppercase",color:"rgba(140,165,210,0.55)"}} data-testid="text-explore-label">EXPLORE</span>
        <button aria-label="Scroll down to explore"
          style={{width:"44px",height:"44px",borderRadius:"50%",border:"1px solid rgba(100,140,220,0.35)",background:"rgba(20,35,70,0.55)",backdropFilter:"blur(6px)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 18px rgba(60,100,255,0.18),0 2px 8px rgba(0,0,0,0.4)",animation:phase==="done"?"pulsate 3s ease-in-out infinite,bobble 2.5s ease-in-out infinite":undefined}}
          data-testid="button-explore-scroll">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(160,195,255,0.80)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div aria-hidden="true" style={{width:"60px",height:"8px",borderRadius:"50%",background:"radial-gradient(ellipse,rgba(80,130,255,0.35) 0%,transparent 70%)",marginTop:"-2px"}}/>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT  (loader → landing)
───────────────────────────────────────────── */
function AppRoot() {
  const [loaded, setLoaded] = useState(false);
  const handleDone = useCallback(() => setLoaded(true), []);
  return (
    <div style={{position:"relative",width:"100%",height:"100%"}}>
      {!loaded && <LoadingScreen onDone={handleDone}/>}
      <div style={{opacity:loaded?1:0,transition:"opacity 0.6s ease 0.15s",pointerEvents:loaded?"auto":"none"}}>
        <Home/>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AppRoot}/>
      <Route component={NotFound}/>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,"")}>
          <Router/>
        </WouterRouter>
        <Toaster/>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
