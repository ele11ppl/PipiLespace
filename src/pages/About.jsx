import { useEffect, useRef, useCallback } from 'react';

/* ===================================================================
   About — DNA double-helix particle deconstruction.

   • 3D helix built from ~2 600 white particles, HORIZONTAL axis (X)
   • Rotates around its own X-axis with cold, elegant frequency
   • Mouse repulsion: nearby particles scatter, drift, and fade forever
   • Bilingual hint text fades out as particles disperse
   • Industrial-copy text fades in as particles clear
   • 8 s auto-fade safety net: text always becomes readable
   =================================================================== */

// ---- DNA constants ------------------------------------------------------
const HELIX_RADIUS  = 78;
const HELIX_LENGTH  = 1100;    // horizontal span in 3D units
const ROTATIONS     = 5;
const PER_ROTATION  = 260;     // particles per strand per rotation
const FOCAL         = 520;     // perspective projection focal length
const ROTATE_SPEED  = 0.004;   // radians / frame (X-axis spin)

// ---- mouse disruption ---------------------------------------------------
const REPULSION_RADIUS   = 75;
const REPULSION_STRENGTH = 1.6;
const DRIFT_DAMPING      = 0.992;
const ALPHA_DECAY        = 0.0012;

// ---- auto-fade ----------------------------------------------------------
const AUTO_FADE_DELAY    = 8000;
const AUTO_FADE_DURATION = 3500;

// ---- derived ------------------------------------------------------------
const TOTAL_PER_STRAND = ROTATIONS * PER_ROTATION;

// =========================================================================
//  Particle factory — helix along X-axis
// =========================================================================

function buildParticles() {
  const arr = [];
  for (let i = 0; i < TOTAL_PER_STRAND; i++) {
    const theta = (i / PER_ROTATION) * Math.PI * 2;
    const origX = (i / TOTAL_PER_STRAND) * HELIX_LENGTH - HELIX_LENGTH / 2;

    // strand 0
    arr.push({
      theta,
      origX,
      strand: 0,
      x: origX, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      disrupted: false,
      alpha: 0.82,
      _sx: 0, _sy: 0, _scale: 1,
    });

    // strand 1
    arr.push({
      theta,
      origX,
      strand: 1,
      x: origX, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      disrupted: false,
      alpha: 0.82,
      _sx: 0, _sy: 0, _scale: 1,
    });
  }
  return arr;
}

// =========================================================================
//  Component
// =========================================================================

export default function About() {
  const canvasRef  = useRef(null);
  const textRef    = useRef(null);
  const hintRef    = useRef(null);
  const particlesRef = useRef(null);
  const rotationRef  = useRef(0);
  const mouseRef     = useRef({ x: -999, y: -999 });
  const lastMoveRef  = useRef(Date.now());
  const hintSmoothRef = useRef(1);  // lerp-smoothed hint opacity
  const hintGoneRef   = useRef(false); // locks hint to 0 only when fully gone
  const autoFadeMaxRef = useRef(0);    // monotonic autoFade — never decreases
  const copyMaxRef     = useRef(0);    // monotonic text opacity — never fades out
  const rafRef       = useRef(null);

  // ---- RAF loop ---------------------------------------------------------
  const loop = useCallback((canvas, ctx, particles, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const now = Date.now();
    const mouse = mouseRef.current;

    // X-axis rotation (helix spins around its own horizontal axis)
    rotationRef.current += ROTATE_SPEED;
    const rx = rotationRef.current;
    const cosRX = Math.cos(rx);
    const sinRX = Math.sin(rx);

    // auto-fade — monotonic: once it starts climbing, it never resets
    const idleMs = now - lastMoveRef.current;
    let currentAutoFade = 0;
    if (idleMs > AUTO_FADE_DELAY) {
      currentAutoFade = Math.min(1, (idleMs - AUTO_FADE_DELAY) / AUTO_FADE_DURATION);
    }
    if (currentAutoFade > autoFadeMaxRef.current) {
      autoFadeMaxRef.current = currentAutoFade;
    }
    const autoFade = autoFadeMaxRef.current;

    ctx.clearRect(0, 0, w, h);

    let disruptedCount = 0;

    // ---- pass 1: compute 3D → 2D for every particle -------------------
    for (const p of particles) {
      if (p.alpha <= 0.005) continue;

      if (!p.disrupted) {
        // helix formula — circular cross-section in YZ plane
        const phase = p.strand === 0 ? 0 : Math.PI;
        const ly = HELIX_RADIUS * Math.cos(p.theta + phase);
        const lz = HELIX_RADIUS * Math.sin(p.theta + phase);

        // X-axis rotation (spin around horizontal axis)
        p.y = ly * cosRX - lz * sinRX;
        p.z = ly * sinRX + lz * cosRX;

        if (autoFade > 0) {
          p.alpha = 0.82 * (1 - autoFade);
        }
      } else {
        // drift
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vx *= DRIFT_DAMPING;
        p.vy *= DRIFT_DAMPING;
        p.vz *= DRIFT_DAMPING;
        p.alpha -= ALPHA_DECAY;
        disruptedCount++;
      }

      if (p.alpha <= 0.005) continue;

      // perspective projection
      const scale = FOCAL / (FOCAL + p.z);
      p._sx    = p.x * scale + cx;
      p._sy    = p.y * scale + cy;
      p._scale = scale;
    }

    // ---- pass 2: mouse disruption --------------------------------------
    if (autoFade < 1) {
      for (const p of particles) {
        if (p.disrupted || p.alpha <= 0.005) continue;
        const dx = p._sx - mouse.x;
        const dy = p._sy - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < REPULSION_RADIUS && dist > 0.1) {
          const force = (1 - dist / REPULSION_RADIUS) * REPULSION_STRENGTH;
          const nx = dx / dist;
          const ny = dy / dist;
          p.vx = nx * force + (Math.random() - 0.5) * force * 1.2;
          p.vy = ny * force + (Math.random() - 0.5) * force * 1.2;
          p.vz = (Math.random() - 0.5) * force * 1.8;
          p.disrupted = true;
        }
      }
    }

    // ---- pass 3: render particles --------------------------------------
    for (const p of particles) {
      if (p.alpha <= 0.005) continue;
      const size = Math.max(0.5, 2.2 * p._scale);
      ctx.beginPath();
      ctx.arc(p._sx, p._sy, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.alpha.toFixed(3)})`;
      ctx.fill();
    }

    // ---- pass 4: rungs -------------------------------------------------
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 0.25;
    for (let i = 0; i < particles.length - 1; i += 2) {
      const a = particles[i];
      const b = particles[i + 1];
      if (a.alpha <= 0.02 || b.alpha <= 0.02) continue;
      if (a.disrupted || b.disrupted) continue;
      ctx.beginPath();
      ctx.moveTo(a._sx, a._sy);
      ctx.lineTo(b._sx, b._sy);
      ctx.stroke();
    }

    // ---- opacity outputs -----------------------------------------------
    const disruptedFrac = disruptedCount / particles.length;

    // main copy fades IN — monotonic: once an opacity level is reached it never drops
    const rawCopy = Math.max(Math.min(1, disruptedFrac * 2.6), autoFade);
    if (rawCopy > copyMaxRef.current) {
      copyMaxRef.current = rawCopy;
    }
    const copyOpacity = copyMaxRef.current;

    if (textRef.current) {
      textRef.current.style.opacity = copyOpacity;
      textRef.current.style.pointerEvents = copyOpacity > 0.6 ? 'auto' : 'none';
    }

    // hint text fades OUT — locks only when fully gone, never returns
    if (!hintGoneRef.current && hintSmoothRef.current < 0.005) {
      hintGoneRef.current = true;
    }
    const targetHint = hintGoneRef.current ? 0 : Math.max(0, 1 - disruptedFrac * 4);
    hintSmoothRef.current += (targetHint - hintSmoothRef.current) * 0.07;
    if (hintRef.current) {
      hintRef.current.style.opacity = hintSmoothRef.current;
    }
  }, []);

  // ---- mount / unmount --------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particles = buildParticles();
    particlesRef.current = particles;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      lastMoveRef.current = Date.now();
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w > 0 && h > 0) {
        loop(canvas, ctx, particles, w, h);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  return (
    <div className="about-page">
      {/* ---- full-viewport DNA canvas ---- */}
      <canvas ref={canvasRef} className="about-canvas" />

      {/* ---- hint: fades OUT as particles disperse ---- */}
      <div ref={hintRef} className="about-hint">
        <span className="about-hint__en">SWIPE CURSOR TO DISSOLVE THE DNA</span>
        <span className="about-hint__zh">滑动鼠标打散 DNA 以查看</span>
      </div>

      {/* ---- industrial-copy: fades IN as particles clear ---- */}
      <div ref={textRef} className="about-copy">

        <div className="about-bio-section">
          {/* ---- 中文整段 ---- */}
          <div className="bio-zh-group">
            <p>你好，我是屁屁乐~</p>
            <p>真的非常普通！坑泛且杂，单机不专业努力学习中(˃ ⌑ ˂ഃ )。</p>
          </div>

          {/* ---- 英文整段 ---- */}
          <div className="bio-en-group">
            <p>Hey! I'm PPL.</p>
            <p>Nothing special, just a regular person. I've got a messy mix of hobbies, I'm not a pro, and I mostly play solo — but hey, I'm trying my best to learn (˃ ⌑ ˂ഃ ).</p>
          </div>
        </div>

        <hr className="about-separator" />

        <h2 className="about-contact-heading">CONTACT</h2>

        <div className="about-contact-matrix">
          <div className="matrix-item">
            <span className="matrix-label">XHS //</span>
            <a href="https://xhslink.com/m/AHHPySKql9b" className="matrix-link" target="_blank" rel="noreferrer" data-cursor="pointer">屁屁乐</a>
          </div>
          <div className="matrix-item">
            <span className="matrix-label">MHS //</span>
            <a href="https://www.mihuashi.com/profiles/3758476?role=painter&utm_source=direct&utm_campaign=userpage&utm_medium=share&utm_content=ordinary" className="matrix-link" target="_blank" rel="noreferrer" data-cursor="pointer">屁屁乐ele</a>
          </div>
          <div className="matrix-item">
            <span className="matrix-label">EMAIL //</span>
            <a href="mailto:2337730194@qq.com" className="matrix-link" data-cursor="pointer">2337730194@qq.com</a>
          </div>
        </div>
      </div>

      <style>{`
        .about-page {
          position: relative;
          width: 100%;
          height: 100%;
        }

        /* ---- canvas ---- */
        .about-canvas {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        /* ---- hint text: centered below helix, fades OUT ---- */
        .about-hint {
          position: absolute;
          left: 50%;
          top: calc(50% + 120px);
          transform: translate(-50%, 0);
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
          opacity: 1;
        }

        .about-hint__en {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-weight: 300;
          letter-spacing: 0.14em;
          color: #888;
        }

        .about-hint__zh {
          font-family: var(--font-sans);
          font-size: 0.7rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          color: #666;
        }

        /* ---- main copy: full-viewport centred, internal left-align ---- */
        .about-copy {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.9s var(--ease-out);
        }

        .about-copy > * {
          width: 100%;
          max-width: 480px;
          text-align: left;
        }

        /* ---- bio section — Chinese block above, English block below ---- */
        .about-bio-section {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: var(--space-10);
        }

        .bio-zh-group {
          margin-bottom: var(--space-6);
        }

        .bio-zh-group p {
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 300;
          line-height: 1.75;
          letter-spacing: 0.02em;
          color: #FFFFFF;
          margin: 0 0 var(--space-2) 0;
          text-align: left;
        }

        .bio-en-group p {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          font-weight: 300;
          line-height: 1.65;
          letter-spacing: 0.02em;
          color: #CCCCCC;
          margin: 0 0 var(--space-1) 0;
          text-align: left;
        }

        /* ---- separator ---- */
        .about-separator {
          width: 100%;
          height: 1px;
          border: none;
          background: #333333;
          margin: 2.5rem 0 1.5rem 0;
        }

        /* ---- CONTACT heading ---- */
        .about-contact-heading {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.12em;
          color: #FFFFFF;
          text-align: left;
          margin-bottom: var(--space-4);
        }

        /* ---- contact matrix ---- */
        .about-contact-matrix {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .matrix-item {
          display: flex;
          align-items: baseline;
          justify-content: flex-start;
          gap: var(--space-3);
          font-size: 0.7rem;
        }

        .matrix-label {
          font-family: var(--font-mono);
          font-weight: 300;
          letter-spacing: 0.08em;
          color: #AAAAAA;
          flex-shrink: 0;
          text-align: left;
        }

        .matrix-link {
          font-family: var(--font-mono);
          font-weight: 300;
          letter-spacing: 0.04em;
          color: #FFFFFF;
          border-bottom: 1px solid transparent;
          transition:
            color var(--dur-normal) var(--ease-out),
            border-color var(--dur-normal) var(--ease-out);
        }

        .matrix-link:hover {
          color: var(--color-fg);
          border-bottom-color: var(--color-fg);
        }
      `}</style>
    </div>
  );
}
