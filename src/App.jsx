import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import Tutorials from './pages/Tutorials';
import Contact from './pages/Contact';

export default function App() {
  return (
    <BrowserRouter basename="/PipiLespace">
      <Routes>
        {/* Layout wraps all routes — background, nav & audio persist */}
        <Route element={<Layout />}>
          <Route index                  element={<Navigate to="/about" replace />} />
          <Route path="about"           element={<About />} />
          <Route path="portfolio"       element={<Portfolio />} />
          <Route path="tutorials/*"     element={<Tutorials />} />
          <Route path="contact"         element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
