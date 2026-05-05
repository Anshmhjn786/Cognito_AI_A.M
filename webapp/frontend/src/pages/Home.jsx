import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex-grow flex flex-col items-center justify-center text-center relative"
    >
      {/* Abstract Hero Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue text-sm font-mono mb-8 shadow-[0_0_15px_rgba(0,212,255,0.2)]">
          <ShieldAlert size={16} />
          <span>ADVANCED DEEPFAKE DETECTION ENGINE v3.0</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black font-sans tracking-tight mb-6 leading-tight">
          Unmask The <br />
          <span className="animate-shimmer block mt-2">Synthesized Reality</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light">
          Harnessing multi-layered neural network analysis to detect synthetic media, facial manipulations, and voice cloning in real-time.
        </p>

        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={() => navigate('/imgx')}
            className="group relative px-8 py-4 bg-white text-obsidian font-bold font-sans rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            <span className="relative flex items-center gap-2">
              Launch ImgX <ArrowRight size={18} />
            </span>
          </button>

          <button 
            onClick={() => navigate('/vidx')}
            className="px-8 py-4 glass-panel text-white font-bold font-sans rounded-lg transition-all hover:bg-white/10 hover:neon-border hover:text-glow"
          >
            Launch VidX
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Home;
