import { motion } from 'framer-motion';
import Works from './Works';
import BookView from './BookView';

const DETAIL_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

const CATEGORY_MAP = ['googdesign', 'book', 'portfolio_typographydesign', 'more'];

export default function PortfolioDetail({ categoryIndex, onBack }) {
  const cat = CATEGORY_MAP[categoryIndex] || 'typographydesign';

  return (
    <motion.div className="pf-detail" {...DETAIL_FADE}>
      <header className="pf-detail__head">
        <button className="pf-detail__back" onClick={onBack}>
          [ BACK TO LINE ]
        </button>
      </header>

      {cat === 'book' ? <BookView /> : <Works category={cat} />}

      <style>{`
        .pf-detail { width: 100%; }
        .pf-detail__head {
          display: flex; justify-content: flex-end;
          margin-bottom: var(--space-6);
        }
        .pf-detail__back {
          font-family: var(--font-mono); font-size: 0.6rem;
          letter-spacing: 0.12em; color: var(--color-muted);
          padding: var(--space-1) 0;
          border-bottom: 1px solid transparent;
          transition: color var(--dur-normal), border-color var(--dur-normal);
        }
        .pf-detail__back:hover {
          color: var(--color-fg); border-bottom-color: var(--color-fg);
        }
      `}</style>
    </motion.div>
  );
}
