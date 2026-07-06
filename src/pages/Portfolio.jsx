import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import PortfolioScanner from '../components/PortfolioScanner';
import PortfolioDetail from '../components/PortfolioDetail';

export default function Portfolio() {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleSelect = useCallback((i) => setSelectedIndex(i), []);
  const handleBack  = useCallback(() => setSelectedIndex(null), []);

  const isCompact = selectedIndex !== null;

  return (
    <section className={`portfolio-page${isCompact ? ' is-detail' : ''}`}>
      <PortfolioScanner
        isCompact={isCompact}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
      />

      <AnimatePresence mode="wait">
        {isCompact && (
          <PortfolioDetail
            key={selectedIndex}
            categoryIndex={selectedIndex}
            onBack={handleBack}
          />
        )}
      </AnimatePresence>

      <style>{`
        .portfolio-page {
          width: 100%;
        }

        .portfolio-page.is-detail {
          max-width: 880px;
          margin: 0 auto;
          overflow-y: auto;
          max-height: 100vh;
          padding-bottom: var(--space-16);
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .portfolio-page.is-detail::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
