import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const modules01 = import.meta.glob(
  '/src/assets/works/book/01/*.{jpg,jpeg,png,webp,gif}',
  { eager: true, query: '?url' },
);
const items01 = Object.entries(modules01)
  .sort(([a], [b]) => b.localeCompare(a))
  .map(([, m]) => m.default);

const modules02 = import.meta.glob(
  '/src/assets/works/book/02/*.{jpg,jpeg,png,webp,gif}',
  { eager: true, query: '?url' },
);
const RE = /(\d+to\d+)\.(jpg|jpeg|png|webp|gif)$/i;
const items02 = Object.entries(modules02)
  .sort(([a], [b]) => b.localeCompare(a))
  .map(([path, mod]) => {
    const m = path.split('/').pop().match(RE);
    return { src: mod.default, ratio: m ? m[1] : '1to1' };
  });

export default function BookView() {
  const [mode, setMode] = useState('01');
  const [selected, setSelected] = useState(null);
  const [showNav, setShowNav] = useState(false);
  const close = useCallback(() => setSelected(null), []);
  const scrollRef = useRef(null);
  const dragRef = useRef({ down: false, startX: 0, scrollLeft: 0 });

  // ---- wheel → horizontal scroll (01) + scroll spy ----
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowNav(mode === '01' ? el.scrollLeft > 200 : el.scrollTop > 100);
    };
    if (mode === '01') {
      const onWheel = (e) => { e.preventDefault(); el.scrollLeft += e.deltaY; };
      el.addEventListener('wheel', onWheel, { passive: false });
      el.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        el.removeEventListener('wheel', onWheel);
        el.removeEventListener('scroll', onScroll);
      };
    } else {
      const container = document.querySelector('.portfolio-page.is-detail');
      const target = container || window;
      target.addEventListener('scroll', onScroll, { passive: true });
      return () => target.removeEventListener('scroll', onScroll);
    }
  }, [mode]);

  const scrollToStart = () => {
    if (mode === '01') scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    else {
      const el = document.querySelector('.portfolio-page.is-detail');
      if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ---- grab / drag (01) ----
  const onMouseDown = (e) => {
    if (mode !== '01') return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { down: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
  };
  const onMouseUp   = () => { dragRef.current.down = false; };
  const onMouseMove = (e) => {
    if (!dragRef.current.down) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = dragRef.current.scrollLeft - (x - dragRef.current.startX);
  };

  return (
    <div className="bv-root">
      {/* ---- switcher ---- */}
      <div className="bv-switch">
        <button className={`bv-switch__btn${mode === '01' ? ' is-on' : ''}`} onClick={() => setMode('01')}>01</button>
        <span className="bv-switch__sep">/</span>
        <button className={`bv-switch__btn${mode === '02' ? ' is-on' : ''}`} onClick={() => setMode('02')}>02</button>
      </div>

      {/* ---- 01 Zine Gallery (position:fixed to escape ancestor overflow:hidden) ---- */}
      {mode === '01' && (
        <>
          <div className="bv-zine-spacer" />
          <div className="bv-zine">
            <div
              className="bv-zine__track"
              ref={scrollRef}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onMouseMove={onMouseMove}
            >
              {items01.map((src, i) => (
                <div className="bv-zine-item" key={i}>
                  <img src={src} alt="" draggable={false} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ---- 02 Grid ---- */}
      {mode === '02' && (
        <div className="bv-grid">
          {items02.map((item, i) => (
            <div key={i} className="bv-card" onClick={() => setSelected(item)}>
              <img src={item.src} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {/* ---- nav button ---- */}
      {showNav && (
        <button className="back-to-top-btn" onClick={scrollToStart} data-cursor="pointer">
          {mode === '01' ? '←' : '↑'}
        </button>
      )}

      {/* ---- lightbox (02 only) ---- */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="bv-overlay" onClick={close}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="bv-modal" onClick={(e) => e.stopPropagation()}>
              <img src={selected.src} alt="" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .bv-root { width: 100%; }

        .bv-switch {
          display: flex; align-items: center; gap: 6px;
          margin-bottom: var(--space-6);
        }
        .bv-switch__btn {
          font-family: var(--font-mono); font-size: 0.7rem;
          letter-spacing: 0.08em; color: #555;
          background: none; border: none; cursor: pointer;
          padding: 2px 6px; transition: color 0.2s;
        }
        .bv-switch__btn:hover { color: #aaa; }
        .bv-switch__btn.is-on { color: #fff; font-weight: 600; }
        .bv-switch__sep { color: #333; font-size: 0.6rem; }

        /* ---- 01 zine: fixed layer escapes all ancestor overflow:hidden ---- */
        .bv-zine-spacer { height: 35vh; }
        .bv-zine {
          position: fixed; left: 0; bottom: 8vh;
          width: 100vw; overflow: visible;
          z-index: 15;
          user-select: none; -webkit-user-select: none;
        }
        .bv-zine__track {
          display: flex; flex-direction: row; align-items: center;
          gap: 120px; padding: 5vh 15vw;
          overflow-x: auto; overflow-y: visible;
          cursor: grab;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .bv-zine__track::-webkit-scrollbar { display: none; }
        .bv-zine__track:active { cursor: grabbing; }
        .bv-zine-item {
          flex-shrink: 0;
          pointer-events: auto;
          transition: transform 0.3s ease;
        }
        .bv-zine-item:hover {
          transform: scale(1.06);
        }
        .bv-zine-item img {
          max-height: 30vh; max-width: 50vw;
          height: auto; width: auto; display: block;
          object-fit: contain;
          box-shadow: 0 10px 40px rgba(0,0,0,0.06);
          pointer-events: none;
        }

        /* ---- 02 grid ---- */
        .bv-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .bv-card {
          user-select: none; -webkit-user-select: none;
          cursor: pointer; overflow: hidden; border-radius: 8px;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .bv-card img {
          width: 100%; height: auto; display: block;
        }
        .bv-card:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 10;
        }

        /* ---- lightbox ---- */
        .bv-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .bv-modal img {
          max-width: 600px; max-height: 80vh;
          width: auto; height: auto;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.8);
        }
      `}</style>
    </div>
  );
}
