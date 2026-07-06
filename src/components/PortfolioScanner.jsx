import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

/* ===================================================================
   PortfolioScanner — interactive SVG polyline chart.
   Data-driven: add strings to CATEGORIES → nodes + labels auto-scale.
   =================================================================== */

const CATEGORIES = [
  { label: '衍生品设计', en: 'GOODS DESIGN' },
  { label: '刊本设计',   en: 'BOOK DESIGN' },
  { label: '字体设计',   en: 'TYPOGRAPHY' },
  { label: '更多',       en: 'MORE' },
];

// layout constants (viewBox units)
const VB_W = 800;
const VB_H = 200;
const PAD_X = 70;          // horizontal padding inside viewBox
const BASE_Y = 100;        // resting y of the polyline
const NODE_R  = 5;         // base node radius

const SINE_AMP    = 14;    // pixels of vertical sine displacement
const SINE_FREQ   = 0.55;  // radians / second
const PHASE_STEP  = 1.8;   // phase offset between adjacent nodes

const MAGNET_R    = 44;    // proximity radius (viewBox units)
const MAGNET_SCALE = 1.9;  // max scale factor when cursor is dead-on

const COMPACT_Y   = 24;    // y when in compact (mini-nav) mode
const SUB_STEPS   = 5;     // interpolated points between each node pair

// ---- helpers ------------------------------------------------------------

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function PortfolioScanner({ isCompact, selectedIndex, onSelect }) {
  const [time, setTime] = useState(0);
  const [mouse, setMouse] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    let raf;
    const loop = (t) => {
      setTime(t * 0.001);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    setMouse({ x: svgPt.x, y: svgPt.y });
  }, []);

  const handleMouseLeave = useCallback(() => setMouse(null), []);

  const N = CATEGORIES.length;
  const stepX = (VB_W - PAD_X * 2) / Math.max(1, N - 1);

  const nodes = CATEGORIES.map((cat, i) => {
    const x = PAD_X + i * stepX;
    const baseY = lerp(BASE_Y, COMPACT_Y, isCompact ? 1 : 0);
    const waveY = SINE_AMP * Math.sin(time * SINE_FREQ + i * PHASE_STEP);
    const y = isCompact ? COMPACT_Y + waveY * 0.22 : baseY + waveY;

    let scale = 1;
    if (!isCompact && mouse) {
      const d = Math.hypot(mouse.x - x, mouse.y - y);
      if (d < MAGNET_R) {
        scale = 1 + (1 - d / MAGNET_R) * (MAGNET_SCALE - 1);
      }
    }

    const isSelected = selectedIndex === i;

    return { ...cat, i, x, y, scale, isSelected };
  });

  // ---- build smooth polyline (main nodes + sub-steps) -------------------
  const polyPoints = [];
  for (let i = 0; i < nodes.length; i++) {
    if (i > 0) {
      // insert sub-steps between node i-1 and node i
      for (let s = 1; s <= SUB_STEPS; s++) {
        const t = s / (SUB_STEPS + 1);
        const sx = lerp(nodes[i - 1].x, nodes[i].x, t);
        const sy = lerp(nodes[i - 1].y, nodes[i].y, t);
        // add subtle per-point wave variation
        const micro = Math.sin(time * 1.4 + i * 2.3 + s * 0.7) * (isCompact ? 1.0 : 4.5);
        polyPoints.push(`${sx.toFixed(1)},${(sy + micro).toFixed(1)}`);
      }
    }
    polyPoints.push(`${nodes[i].x.toFixed(1)},${nodes[i].y.toFixed(1)}`);
  }

  return (
    <motion.div
      className={`portfolio-scanner${isCompact ? ' is-compact' : ''}`}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="scanner__svg"
      >
        {/* ---- the breathing polyline ---- */}
        <polyline
          points={polyPoints.join(' ')}
          fill="none"
          stroke={isCompact ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.45)'}
          strokeWidth={isCompact ? 0.5 : 1.0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ---- nodes + labels ---- */}
        {nodes.map((n) => (
          <g key={n.i}>
            {/* magnetic halo ring */}
            {!isCompact && n.scale > 1.05 && (
              <circle
                cx={n.x}
                cy={n.y}
                r={NODE_R * n.scale * 1.8}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={0.6}
              />
            )}

            {/* node dot */}
            <circle
              cx={n.x}
              cy={n.y}
              r={NODE_R * n.scale}
              fill={n.isSelected ? '#fff' : 'rgba(255,255,255,0.8)'}
              style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              onClick={() => onSelect(n.i)}
            />

            {/* labels — two-line: English above, Chinese below */}
            {(() => {
              const below = n.i % 2 === 0;          // alternate above / below
              const enY = isCompact
                ? n.y + 14
                : n.y + (below ? 22 : -41);
              const zhY = isCompact
                ? n.y + 26
                : n.y + (below ? 37 : -26);
              const enSize = isCompact ? 11 : 14;
              const zhSize = isCompact ? 9 : 11;

              return (
                <>
                  <text
                    x={n.x}
                    y={enY}
                    textAnchor="middle"
                    fill={n.isSelected ? '#fff' : 'rgba(255,255,255,0.6)'}
                    fontFamily="'Helvetica Neue','Arial','PingFang SC','Microsoft YaHei',sans-serif"
                    fontSize={enSize}
                    letterSpacing="0.06em"
                    style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                  >
                    {n.en}
                  </text>
                  <text
                    x={n.x}
                    y={zhY}
                    textAnchor="middle"
                    fill={n.isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)'}
                    fontFamily="'Helvetica Neue','Arial','PingFang SC','Microsoft YaHei',sans-serif"
                    fontSize={zhSize}
                    letterSpacing="0.08em"
                    style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                  >
                    {n.label}
                  </text>
                </>
              );
            })()}
          </g>
        ))}
      </svg>

      <style>{`
        .portfolio-scanner {
          width: 100%;
          cursor: crosshair;
          transition: margin 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .portfolio-scanner.is-compact {
          cursor: default;
          margin-top: calc(var(--space-12) + var(--space-16));
          margin-bottom: var(--space-2);
        }
        .scanner__svg {
          display: block;
          width: 100%;
          height: auto;
        }
      `}</style>
    </motion.div>
  );
}
