import { useEffect, useRef, useState, useCallback } from 'react';

/* ===================================================================
   AudioRipples — Canvas-driven fluid wave rings + wireframe icons.

   Rings emitted every 2.5 s when playing.  32 vertices, quadratic
   bezier midpoint smoothing, sinusoidal R(θ) per vertex.
   Icons: note (muted) → triangle (hover) → pause bars (playing).
   =================================================================== */

const EMIT_INTERVAL = 2500;   // ms between wave emissions
const TOTAL_POINTS  = 48;     // vertices per ring (dense enough for high-freq drift)

export default function AudioRipples({ src = '/audio/bgm.mp3' }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const ringsRef = useRef([]);
  const lastEmitRef = useRef(0);
  const rafRef = useRef(null);
  const fadeRafRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [fading, setFading] = useState(false);

  // ---- Canvas render loop ----------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = performance.now() * 0.001;
      const now = performance.now();

      // dual origins — top-right + bottom-left symmetry
      const trX = canvas.width - 46;
      const trY = 38;
      const blX = 46;
      const blY = canvas.height - 38;

      // emit a new ring every EMIT_INTERVAL ms when playing
      if (playing && now - lastEmitRef.current > EMIT_INTERVAL) {
        ringsRef.current.push({
          radius: 0,
          maxRadius: Math.max(canvas.width, canvas.height) * 0.45,
          alpha: 0.35,
          seed: Math.random() * 100,
          speed: 0.9,
        });
        lastEmitRef.current = now;
      }

      // draw all active rings — each renders twice (TR + BL)
      ringsRef.current = ringsRef.current.filter((ring) => {
        ring.radius += ring.speed;
        ring.alpha = 0.35 * (1 - ring.radius / ring.maxRadius);
        if (ring.alpha <= 0.002) return false;

        // compute the shared drift-algorithm vertices (origin-agnostic)
        const driftPts = [];
        for (let i = 0; i < TOTAL_POINTS; i++) {
          const angle = (i / TOTAL_POINTS) * Math.PI * 2;
          const freq1 = 2.0 + Math.sin(time * 0.3 + ring.seed) * 1.5;
          const freq2 = 4.0 + Math.cos(time * 0.2 - ring.seed) * 2.0;
          const amp1  = 12  + Math.sin(time * 0.5) * 8;
          const amp2  = 8   + Math.cos(time * 0.4) * 6;
          const offset =
            Math.sin(angle * freq1 + time * 1.5 + ring.seed) * amp1 +
            Math.cos(angle * freq2 - time * 2.2 + ring.seed) * amp2;
          driftPts.push({ angle, r: Math.max(0, ring.radius + offset) });
        }

        // ---- helper: draw ring at a given origin with boundary ----
        const drawAt = (ox, oy, boundaryX, invert) => {
          const pts = driftPts.map(({ angle, r }) => ({
            x: ox + Math.cos(angle) * r,
            y: oy + Math.sin(angle) * r,
          }));

          // boundary check: accelerate fade past the invisible wall
          const extremeX = invert
            ? pts.reduce((max, p) => Math.max(max, p.x), -Infinity)   // BL: rightmost
            : pts.reduce((min, p) => Math.min(min, p.x), Infinity);   // TR: leftmost
          const over = invert
            ? Math.max(0, extremeX - boundaryX) / (ring.radius * 0.25)
            : Math.max(0, boundaryX - extremeX) / (ring.radius * 0.25);
          const localAlpha = ring.alpha * Math.max(0, 1 - Math.min(1, over));
          if (localAlpha <= 0.002) return;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(200,200,200,${localAlpha.toFixed(3)})`;
          ctx.lineWidth = 0.85;

          ctx.moveTo(
            (pts[0].x + pts[TOTAL_POINTS - 1].x) / 2,
            (pts[0].y + pts[TOTAL_POINTS - 1].y) / 2,
          );
          for (let i = 0; i < TOTAL_POINTS; i++) {
            const cur = pts[i];
            const nxt = pts[(i + 1) % TOTAL_POINTS];
            ctx.quadraticCurveTo(cur.x, cur.y, (cur.x + nxt.x) / 2, (cur.y + nxt.y) / 2);
          }
          ctx.closePath();
          ctx.stroke();
        };

        // top-right → fades before crossing left 25% boundary
        drawAt(trX, trY, canvas.width * 0.75, false);
        // bottom-left → fades before crossing right 25% boundary
        drawAt(blX, blY, canvas.width * 0.25, true);

        return true;
      });

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [playing]);

  // ---- pause = instant purge: no rings, no residue --------------------
  useEffect(() => {
    if (!playing) {
      ringsRef.current = [];
      lastEmitRef.current = 0;
      // immediate canvas wipe
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      ringsRef.current = [];
      lastEmitRef.current = 0;
    }
  }, [playing]);

  // ---- RAF volume fade -------------------------------------------------
  const rampVolume = useCallback((from, to) => {
    cancelAnimationFrame(fadeRafRef.current);
    const start = performance.now();
    const step = (now) => {
      const el = Math.min((now - start) / 1500, 1);
      const ease = el < 0.5 ? 2 * el * el : -1 + (4 - 2 * el) * el;
      if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, from + (to - from) * ease));
      if (el < 1) { fadeRafRef.current = requestAnimationFrame(step); }
      else { if (to === 0 && audioRef.current) audioRef.current.pause(); setFading(false); }
    };
    fadeRafRef.current = requestAnimationFrame(step);
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || fading) return;
    setFading(true);
    if (playing) { rampVolume(a.volume, 0); setPlaying(false); }
    else { a.volume = 0; a.play().then(() => { rampVolume(0, 0.45); setPlaying(true); }).catch(() => setFading(false)); }
  }, [playing, fading, rampVolume]);

  // ---- icon ------------------------------------------------------------
  const icon = playing ? 'pause' : hovered ? 'play' : 'note';

  return (
    <>
      <canvas ref={canvasRef} className="rp-canvas" aria-hidden="true" />

      <button
        className="rp-btn"
        data-cursor="pointer"
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        <audio ref={audioRef} src={src} loop preload="none" />

        <svg viewBox="0 0 24 24" className="rp-icon" aria-hidden="true">
          {/* muted: double music note */}
          {icon === 'note' && (
            <g stroke="#aaa" strokeWidth="0.9" fill="none">
              <line x1="8" y1="18" x2="8" y2="8" />
              <line x1="15" y1="16" x2="15" y2="6" />
              <ellipse cx="6.5" cy="17.5" rx="2" ry="1.5" />
              <ellipse cx="13.5" cy="15.5" rx="2" ry="1.5" />
              <line x1="8" y1="10" x2="15" y2="8" strokeWidth="0.6" />
            </g>
          )}

          {/* hover: play triangle */}
          {icon === 'play' && (
            <polygon points="8,5 8,19 19,12"
              fill="none" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
          )}

          {/* playing: pause bars */}
          {icon === 'pause' && (
            <g fill="#fff" opacity="0.9">
              <rect x="6" y="6" width="4" height="12" rx="0.5" />
              <rect x="14" y="6" width="4" height="12" rx="0.5" />
            </g>
          )}
        </svg>
      </button>

      <style>{`
        .rp-canvas {
          position: fixed; inset: 0; z-index: 40; pointer-events: none;
        }

        .rp-btn {
          position: fixed; top: var(--space-6); right: var(--space-8);
          z-index: 50; cursor: pointer;
          background: none; border: 1px solid transparent;
          padding: 6px; display: flex; align-items: center; justify-content: center;
          transition: border-color 0.3s ease;
          user-select: none; -webkit-user-select: none;
        }

        .rp-btn:hover {
          border-color: rgba(255,255,255,0.12);
        }
        .rp-btn:focus-visible {
          outline: 1px solid rgba(255,255,255,0.3);
          outline-offset: 2px;
        }

        .rp-icon {
          width: 20px; height: 20px; display: block;
          animation: rp-fade 2.2s ease-in-out infinite;
        }
        .rp-btn:hover .rp-icon { animation: none; }

        @keyframes rp-fade {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 1; }
        }
      `}</style>
    </>
  );
}
