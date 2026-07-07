import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Loading from './components/Loading';
import Layout from './components/Layout';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import Tutorials from './pages/Tutorials';
import Contact from './pages/Contact';

const MIN_LOAD_MS = 1800; // minimum time to display the breathing dots

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const start = performance.now();

    const done = () => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, MIN_LOAD_MS - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    };

    // fire when document + all sub-resources are ready
    if (document.readyState === 'complete') {
      done();
    } else {
      window.addEventListener('load', done, { once: true });
      // safety net: fire after 4 s regardless
      const safety = setTimeout(done, 4000);
      return () => {
        window.removeEventListener('load', done);
        clearTimeout(safety);
      };
    }
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
          >
            <Loading />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isLoading && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.15 }}
            style={{ width: '100%', height: '100%' }}
          >
            <HashRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route index                  element={<Navigate to="/about" replace />} />
                  <Route path="about"           element={<About />} />
                  <Route path="portfolio"       element={<Portfolio />} />
                  <Route path="tutorials/*"     element={<Tutorials />} />
                  <Route path="contact"         element={<Contact />} />
                </Route>
              </Routes>
            </HashRouter>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
