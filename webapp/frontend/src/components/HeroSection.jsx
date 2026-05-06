import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 flex flex-col justify-center min-h-screen max-w-3xl">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-[1px] bg-primary/50" />
          <span className="text-primary font-mono text-[10px] tracking-[0.4em] uppercase">
            SYSTEM ONLINE // FORENSIC INTELLIGENCE
          </span>
        </div>
        
        <h1 className="text-[7.5rem] font-bold tracking-[0.15em] leading-none mb-6 text-white font-orbitron select-none relative group">
          <span className="relative inline-block">
            <span className="relative z-10 opacity-90">COGNATO</span>
            {/* Subtle Scanning Shimmer */}
            <motion.div 
              animate={{ left: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
              className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-primary/20 to-transparent skew-x-[-20deg] z-20 pointer-events-none"
            />
          </span>
          <br />
          <span className="text-primary glow-text-strong relative">
            <span className="opacity-80">AI</span>
            <motion.span 
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 blur-md text-primary select-none"
            >
              AI
            </motion.span>
          </span>
        </h1>
        
        <div className="pl-2 border-l-2 border-primary/20 ml-2 mb-12">
          <h2 className="text-xl font-light text-gray-300 mb-2 tracking-wide uppercase">
            AI-powered forensic detection for synthetic media
          </h2>
          <p className="text-gray-500 max-w-md leading-relaxed font-light text-sm italic">
            Pixel-level analysis. Frame-by-frame intelligence. Mathematical certainty in a world of deception.
          </p>
        </div>
        
        <div className="flex gap-8 ml-2">
          <motion.button
            onClick={() => navigate('/image')}
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(0, 245, 255, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            className="px-10 py-4 border border-primary/40 text-primary font-bold rounded-sm transition-all duration-500 relative group overflow-hidden"
          >
            <span className="relative z-10 tracking-[0.2em]">ANALYZE IMAGE</span>
            <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </motion.button>
          
          <motion.button
            onClick={() => navigate('/video')}
            whileHover={{ scale: 1.03, color: '#fff', borderColor: 'rgba(255, 255, 255, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="px-10 py-4 border border-white/10 text-gray-400 font-bold rounded-sm transition-all duration-500"
          >
            <span className="tracking-[0.2em]">ANALYZE VIDEO</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
