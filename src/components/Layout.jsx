import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ParticleTrail from './ParticleTrail';
import Navbar from './Navbar';
import AudioRipples from './AudioRipples';
import CustomCursor from './CustomCursor';

const PAGE_TRANSITION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
};

export default function Layout() {
  const location = useLocation();

  return (
    <div className="layout">
      {/* ---- fixed background layer — never unmounts across routes ---- */}
      <div className="layout__bg">
        <ParticleTrail />
      </div>

      {/* ---- static logo (no interaction, bottom layer) ---- */}
      <img
        src="/assets/design/logo_ppl.png"
        alt=""
        className="design-logo-static"
        aria-hidden="true"
      />

      {/* ---- chrome (nav + audio + cursor) ---- */}
      <Navbar />
      <AudioRipples />
      <CustomCursor />

      {/* ---- page content with route transitions ---- */}
      <main className="layout__main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            {...PAGE_TRANSITION}
            className="layout__page"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`
        .design-logo-static {
          position: fixed;
          top: var(--space-6);
          left: var(--space-8);
          height: 29px;
          width: auto;
          z-index: 1;
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          cursor: default;
          opacity: 0.7;
        }

        .layout {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        /* background canvas — fixed behind everything */
        .layout__bg {
          position: fixed;
          inset: 0;
          z-index: var(--z-canvas);
        }

        .layout__bg canvas {
          display: block;
        }

        /* page container — sits above canvas, lets mouse events through */
        .layout__main {
          position: relative;
          z-index: var(--z-content);
          width: 100%;
          height: 100%;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .layout__page {
          pointer-events: auto;
          width: 100%;
          max-width: 720px;
          padding: var(--space-8) var(--space-6);
        }
      `}</style>
    </div>
  );
}
