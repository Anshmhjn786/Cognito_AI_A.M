import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ScanViewer = ({ mediaUrl, scanProgress, isResult, resultImage }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-full h-full max-h-[500px] aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/5">

        {/* SINGLE BASE IMAGE */}
        <div
          className="absolute inset-0 bg-contain bg-no-repeat bg-center"
          style={{ backgroundImage: `url(${mediaUrl})` }}
        />

        {/* SCANNED OVERLAY (ONLY TOP PART) */}
        {!isResult && (
          <div
            className="absolute inset-0 bg-contain bg-no-repeat bg-center grayscale opacity-80"
            style={{
              backgroundImage: `url(${mediaUrl})`,
              clipPath: `inset(0 0 ${100 - scanProgress}% 0)`
            }}
          />
        )}

        {/* SCAN LINE */}
        {!isResult && (
          <>
            <motion.div
              className="absolute left-0 right-0 h-[2px] bg-primary z-30 shadow-[0_0_10px_#00F5FF]"
              style={{ top: `${scanProgress}%` }}
            />

            <motion.div
              className="absolute left-0 right-0 h-[60px] pointer-events-none z-20"
              style={{
                top: `${scanProgress}%`,
                transform: 'translateY(-50%)',
                background:
                  'linear-gradient(to bottom, rgba(0,245,255,0.15), transparent)',
                filter: 'blur(10px)'
              }}
            />
          </>
        )}

        {/* RESULT OVERLAY */}
        <AnimatePresence>
          {isResult && resultImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-contain bg-no-repeat bg-center mix-blend-screen"
              style={{ backgroundImage: `url(${resultImage})` }}
            />
          )}
        </AnimatePresence>

        {/* PROGRESS HUD */}
        {!isResult && (
          <div className="absolute bottom-4 left-4 right-4 z-40 flex justify-between text-[9px] font-mono">
            <span className="text-primary/80 tracking-widest">
              SCANNING...
            </span>
            <span className="text-white/60">
              {Math.floor(scanProgress)}%
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export default ScanViewer;