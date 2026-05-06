import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HeroSection from './components/HeroSection';
import BackgroundFX from './components/BackgroundFX';
import ImageDetection from './components/ImageDetection';
import VideoDetection from './components/VideoDetection';
import { motion } from 'framer-motion';

import IntelNetwork from './components/IntelNetwork';
import SystemLogs from './components/SystemLogs';

function App() {
  return (
    <div className="relative min-h-screen bg-[#020305] text-white selection:bg-primary/30 selection:text-primary overflow-hidden font-inter">
      <BackgroundFX />
      <Sidebar />

      <main className="relative z-10 pl-24 h-screen flex">
        <Routes>
          <Route path="/" element={<HeroSection />} />
          <Route path="/image" element={<ImageDetection />} />
          <Route path="/video" element={<VideoDetection />} />
          <Route path="/intel-network" element={<IntelNetwork />} />
          <Route path="/system-logs" element={<SystemLogs />} />
        </Routes>
      </main>

      {/* Bottom Info Strip - Immersive & Minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="fixed bottom-8 left-32 flex gap-12 text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase z-20 pointer-events-none"
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
          LATENCY: <span className="text-white/80">142ms</span>
        </div>
      </motion.div>
    </div>
  );
}

export default App;

