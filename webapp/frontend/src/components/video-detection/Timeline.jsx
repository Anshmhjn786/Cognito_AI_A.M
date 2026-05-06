import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const Timeline = ({ frames, flaggedFrames, activeIndex, onFrameClick, isProcessing, apiBase }) => {
  const scrollRef = useRef(null);

  const resolveUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    return `${apiBase}${path}`;
  };

  // Auto-scroll to keep active index in view
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.children[activeIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeIndex]);

  return (
    <div className="w-full bg-black/40 border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 px-2">
        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Temporal_Sequence // Frame_Buffer</span>
        <span className="text-[8px] font-mono text-primary uppercase tracking-widest">Frame {activeIndex + 1} of {frames.length}</span>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-4 no-scrollbar snap-x"
      >
        {frames.map((frame, index) => {
          const isFlagged = flaggedFrames.includes(index);
          const isActive = index === activeIndex;

          return (
            <motion.div
              key={index}
              onClick={() => onFrameClick(index)}
              className={`relative flex-shrink-0 w-24 aspect-video rounded-md overflow-hidden cursor-pointer border-2 transition-all snap-center ${isActive ? 'border-primary scale-105 z-10 shadow-[0_0_15px_#00F5FF33]' : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
              <img 
                src={resolveUrl(frame)} 
                alt={`Frame ${index}`} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.target.style.opacity = 0.2;
                }}
              />
              
              {isFlagged && (
                <div className="absolute top-1 right-1">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="p-0.5 bg-red-500 rounded-full"
                  >
                    <AlertCircle className="w-2 h-2 text-white" />
                  </motion.div>
                </div>
              )}

              {isActive && (
                <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress Track */}
      <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden relative">
        <motion.div 
          className="absolute inset-0 bg-primary/40"
          animate={{ x: `${(activeIndex / (frames.length - 1)) * 100 - 100}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        />
        
        {/* Flagged Markers on Track */}
        {flaggedFrames.map(index => (
          <div 
            key={index}
            className="absolute top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_5px_#ef4444]"
            style={{ left: `${(index / (frames.length - 1)) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default Timeline;
