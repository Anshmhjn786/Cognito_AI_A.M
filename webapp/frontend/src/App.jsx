import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HeroSection from './components/HeroSection';
import ImageDetection from './components/ImageDetection';
import VideoDetection from './components/VideoDetection';
import { motion, AnimatePresence } from 'framer-motion';

import IntelNetwork from './components/IntelNetwork';
import SystemLogs from './components/SystemLogs';

function App() {
  const location = useLocation();
  const [latency, setLatency] = useState(142);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency((prev) => {
        const change = Math.floor(Math.random() * 41) - 20; // -20 to +20
        let next = prev + change;

        // clamp between 80ms and 250ms
        if (next < 80) next = 80;
        if (next > 250) next = 250;

        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#020305] text-white selection:bg-primary/30 selection:text-primary overflow-hidden font-inter">
      <Sidebar />

      <main className="relative z-10 pl-24 h-screen flex">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HeroSection />} />
            <Route path="/image" element={<ImageDetection />} />
            <Route path="/video" element={<VideoDetection />} />
            <Route path="/intel-network" element={<IntelNetwork />} />
            <Route path="/system-logs" element={<SystemLogs />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Bottom Info Strip - Immersive & Minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="fixed bottom-6 right-8 flex gap-12 text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase z-20 pointer-events-none"
      >
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_8px_#00F5FF]" />
          MODELS: <span className="text-primary/80">CORE_V1</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_8px_#00F5FF]" />
          ACCURACY: <span className="text-white/80">98.6%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_8px_#00F5FF]" />
          LATENCY: <span className={
            latency > 180 ? "text-red-400" :
            latency > 130 ? "text-yellow-300" :
            "text-green-400"
          }>
            {latency}ms
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export default App;

