import React from 'react';
import { motion } from 'framer-motion';

export const FrequencyGraph = ({ isScanning = false }) => {
  // Generate random mock data
  const bars = Array.from({ length: 40 }, () => Math.random() * 100);

  return (
    <div className="w-full h-32 flex items-end justify-between gap-[2px] p-2 bg-black/40 rounded-lg border border-white/5">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-full bg-cyber-blue/80 rounded-t-sm"
          initial={{ height: '5%' }}
          animate={{
            height: isScanning ? `${Math.max(10, height)}%` : '5%',
            backgroundColor: isScanning ? '#00d4ff' : '#333'
          }}
          transition={{
            duration: isScanning ? 0.2 : 0.5,
            repeat: isScanning ? Infinity : 0,
            repeatType: 'reverse',
            delay: i * 0.02
          }}
        />
      ))}
    </div>
  );
};

export const HeatmapOverlay = ({ isVisible = false, isFake = false }) => {
  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none mix-blend-screen"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur">
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>
        {isFake ? (
          <>
            {/* Fake hot spots */}
            <circle cx="30%" cy="40%" r="50" fill="#ff3333" filter="url(#blur)" opacity="0.8" />
            <circle cx="70%" cy="60%" r="60" fill="#ff3333" filter="url(#blur)" opacity="0.6" />
            <circle cx="45%" cy="80%" r="40" fill="#ff3333" filter="url(#blur)" opacity="0.7" />
          </>
        ) : (
          <>
            {/* Normal / clear heat signatures */}
            <circle cx="50%" cy="50%" r="80" fill="#00d4ff" filter="url(#blur)" opacity="0.3" />
            <circle cx="20%" cy="30%" r="40" fill="#00d4ff" filter="url(#blur)" opacity="0.2" />
          </>
        )}
      </svg>
    </motion.div>
  );
};

export const TimelineDisturbance = ({ isScanning = false }) => {
  return (
    <div className="w-full h-16 bg-black/60 rounded-md border border-white/10 relative overflow-hidden flex items-center">
      <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent to-alert-red/20 border-r border-alert-red/50"></div>
      
      <svg width="100%" height="100%" preserveAspectRatio="none">
        <motion.path
          d="M 0 32 Q 10 20 20 32 T 40 32 T 60 32 T 80 10 T 100 32 T 120 32 T 140 32 T 160 50 T 180 32 T 200 32 T 220 32"
          fill="none"
          stroke={isScanning ? "#ff3333" : "#00d4ff"}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "linear", repeat: isScanning ? Infinity : 0 }}
          vectorEffect="non-scaling-stroke"
          className="w-full"
        />
      </svg>
      
      {/* Markers */}
      <div className="absolute left-[80px] top-0 bottom-0 w-[1px] bg-alert-red/50">
        <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-alert-red"></div>
      </div>
      <div className="absolute left-[160px] top-0 bottom-0 w-[1px] bg-alert-red/50">
        <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-alert-red"></div>
      </div>
    </div>
  );
};
