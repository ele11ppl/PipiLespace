import { useEffect, useRef } from 'react';

/* ===================================================================
   CustomCursor — raw-DOM, RAF-driven, GPU-accelerated.

   • Inner dot (4 px)   → instant translate3d to mouse
   • Outer ring (24 px) → lerp-chased translate3d (smooth lag)
   • No React state in the hot path — zero re-renders
   • Hover detection via elementFromPoint + CSS class toggling
   =================================================================== */

// ---- magnetic-target selectors ------------------------------------------
const MAGNETIC_SELECTOR = '[data-cursor="pointer"], a, button';

// ---- sizes & easing -----------------------------------------------------
const RING_IDLE  = 24;
const RING_HOVER = 42;
const DOT_SIZE   = 4;
const LERP       = 0.14;   // ring chase speed (lower = more lag)

export default function CustomCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // ---- mutable state (no React, no re-renders) -----------------------
    let targetX  = -100;
    let targetY  = -100;
    let currentX = -100;
    let currentY = -100;
    let raf;

    // ---- mousemove: record target + check hover -----------------------
    const onMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      // hover detection
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const magEl = el?.closest(MAGNETIC_SELECTOR);

      if (magEl) {
        ring.classList.add('is-hovered');
        dot.classList.add('is-hidden');
      } else {
        ring.classList.remove('is-hovered');
        dot.classList.remove('is-hidden');
      }
    };

    // ---- viewport edge --------------------------------------------------
    const onLeave = () => {
      dot.classList.add('is-gone');
      ring.classList.add('is-gone');
    };
    const onEnter = () => {
      dot.classList.remove('is-gone');
      ring.classList.remove('is-gone');
    };

    // ---- RAF render loop ------------------------------------------------
    const animate = () => {
      // inner dot — instant snap to mouse, GPU via translate3d
      dot.style.transform = `translate3d(calc(${targetX}px - 50%), calc(${targetY}px - 50%), 0)`;

      // outer ring — lerp chase, GPU via translate3d
      currentX += (targetX - currentX) * LERP;
      currentY += (targetY - currentY) * LERP;
      ring.style.transform = `translate3d(calc(${currentX}px - 50%), calc(${currentY}px - 50%), 0)`;

      raf = requestAnimationFrame(animate);
    };

    // ---- bind -----------------------------------------------------------
    window.addEventListener('mousemove', onMove, { passive: true });
    document.body.addEventListener('mouseleave', onLeave);
    document.body.addEventListener('mouseenter', onEnter);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.body.removeEventListener('mouseleave', onLeave);
      document.body.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* ---- inner dot ---- */}
      <div ref={dotRef} className="cursor-dot is-gone" />

      {/* ---- outer ring ---- */}
      <div ref={ringRef} className="cursor-ring is-gone" />

      <style>{`
        .cursor-dot {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
          width: ${DOT_SIZE}px;
          height: ${DOT_SIZE}px;
          border-radius: 50%;
          background: #fff;
          mix-blend-mode: difference;
          pointer-events: none;
          will-change: transform;
          transition: opacity 0.18s ease;
        }

        .cursor-ring {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9998;
          width: ${RING_IDLE}px;
          height: ${RING_IDLE}px;
          border-radius: 50%;
          border: 0.5px solid #fff;
          mix-blend-mode: difference;
          pointer-events: none;
          will-change: transform;
          transition:
            width  0.28s var(--ease-out),
            height 0.28s var(--ease-out),
            border-color 0.25s ease,
            opacity 0.22s ease;
        }

        /* ---- states (toggled via classList, NOT React state) ----------- */

        /* hidden while outside viewport */
        .cursor-dot.is-gone,
        .cursor-ring.is-gone {
          opacity: 0;
        }

        /* inner dot hides on magnetic hover */
        .cursor-dot.is-hidden {
          opacity: 0;
        }

        /* outer ring: expand + dashed + breathe on hover */
        .cursor-ring.is-hovered {
          width: ${RING_HOVER}px;
          height: ${RING_HOVER}px;
          border-style: dashed;
          animation: cursor-breathe 2.2s ease-in-out infinite;
        }

        @keyframes cursor-breathe {
          0%, 100% { border-color: rgba(255,255,255,0.9); }
          50%      { border-color: rgba(255,255,255,0.3); }
        }
      `}</style>
    </>
  );
}
