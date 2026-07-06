import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Works.module.css';

/* ===================================================================
   Works — folder-based, no filename rules needed.
   src/assets/works/{category}/*.{ext}  →  auto waterfall.
   =================================================================== */

const modules = import.meta.glob(
  '/src/assets/works/**/*.{jpg,jpeg,png,webp,gif}',
  { eager: true, query: '?url' },
);

// category = folder name, no parsing of filename
const allItems = Object.entries(modules)
  .sort(([a], [b]) => b.localeCompare(a))
  .map(([path, mod]) => {
    const parts = path.split('/');
    const folder = parts[parts.length - 2] || '';
    return { moduleName: folder, src: mod.default };
  });

function resolveCategory(propCat) {
  const p = window.location.pathname.toLowerCase();
  const keys = ['typography', 'typographydesign', 'logo', 'print', 'googdesign', 'portfolio_typographydesign'];
  for (const k of keys) { if (p.includes(k)) return k; }
  return propCat || null;
}

export default function Works({ category: propCategory }) {
  const [selected, setSelected] = useState(null);
  const [showTop, setShowTop] = useState(false);
  const close = useCallback(() => setSelected(null), []);

  const cat = resolveCategory(propCategory);
  const items = cat
    ? allItems.filter((i) => i.moduleName.toLowerCase().includes(cat.toLowerCase()))
    : allItems;

  useEffect(() => {
    const onScroll = () => {
      const el = document.querySelector('.portfolio-page.is-detail');
      setShowTop((el ? el.scrollTop : window.scrollY) > 100);
    };
    const container = document.querySelector('.portfolio-page.is-detail');
    if (container) container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (container) container.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollTop = () => {
    const el = document.querySelector('.portfolio-page.is-detail');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {items.length === 0 ? (
        <div className={styles.empty}>待上传</div>
      ) : (
        <div className={styles.grid}>
          {items.map((item, i) => (
            <div key={i} className={styles.card} onClick={() => setSelected(item)}>
              <img src={item.src} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            className={styles.overlay}
            onClick={close}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <img src={selected.src} alt="" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showTop && (
        <button className="back-to-top-btn" onClick={scrollTop} data-cursor="pointer">↑</button>
      )}
    </div>
  );
}
