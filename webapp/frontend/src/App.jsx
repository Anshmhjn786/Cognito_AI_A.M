import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layout
import RootLayout from './layouts/RootLayout';

// Pages
import Home from './pages/Home';
import ImgX from './pages/ImgX';
import VidX from './pages/VidX';
import Research from './pages/Research';
import About from './pages/About';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="imgx" element={<ImgX />} />
          <Route path="vidx" element={<VidX />} />
          <Route path="research" element={<Research />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
