import React, { useEffect, useState, useMemo } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

const BackgroundFX = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 40, stiffness: 60, restDelta: 0.001 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  
  // Mesh parallax has a bit more lag/delay for depth
  const meshX = useSpring(mouseX, { damping: 25, stiffness: 40 });
  const meshY = useSpring(mouseY, { damping: 25, stiffness: 40 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 40;
      const y = (clientY / window.innerHeight - 0.5) * 40;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Mesh Points Simulation
  const meshPoints = useMemo(() => [
    { x: '45%', y: '25%', label: 'FRONTAL' },
    { x: '55%', y: '25%', label: 'FRONTAL' },
    { x: '50%', y: '35%', label: 'GLABELLA' },
    { x: '42%', y: '40%', label: 'EYE_L' },
    { x: '58%', y: '40%', label: 'EYE_R' },
    { x: '50%', y: '50%', label: 'NASAL' },
    { x: '45%', y: '60%', label: 'CHEEK_L' },
    { x: '55%', y: '60%', label: 'CHEEK_R' },
    { x: '50%', y: '70%', label: 'MENTAL' },
    { x: '40%', y: '65%', label: 'JAW_L' },
    { x: '60%', y: '65%', label: 'JAW_R' },
  ], []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#020305]">
      {/* Background Face - Full head down to neck position */}
      <motion.div 
        style={{ 
          x: springX, 
          y: springY,
          scale: 1,
        }}
        className="absolute right-0 top-0 h-full w-[55%] z-0"
      >
        <motion.div 
          className="absolute inset-0 bg-no-repeat bg-cover mix-blend-screen opacity-100"
          style={{
            backgroundImage: `url('/face2.jpeg')`,
            backgroundPosition: 'right center',
          }}
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Soft Vignette Overlay directly on face layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020305] via-transparent to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020305]/60 via-transparent to-[#020305]/90" />
      </motion.div>

      {/* Depth Layer 1: Subtle Blur Mesh Shadow (Optional) */}
      
      {/* Facial Landmarks Mesh Overlay */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible">
        <defs>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <motion.g 
          style={{ 
            x: meshX, 
            y: meshY 
          }}
        >
          {/* Animated Connecting Lines */}
          <g opacity="0.05">
            <motion.path
              d="M 45% 25% L 55% 25% L 58% 40% L 50% 50% L 42% 40% Z"
              fill="none"
              stroke="#00F5FF"
              strokeWidth="0.5"
              animate={{ 
                strokeDashoffset: [0, 20, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.path
              d="M 42% 40% L 45% 60% L 50% 70% L 55% 60% L 58% 40%"
              fill="none"
              stroke="#00F5FF"
              strokeWidth="0.5"
            />
            <line x1="50%" y1="35%" x2="50%" y2="50%" stroke="#00F5FF" strokeWidth="0.5" />
            <line x1="45%" y1="60%" x2="40%" y2="65%" stroke="#00F5FF" strokeWidth="0.5" />
            <line x1="55%" y1="60%" x2="60%" y2="65%" stroke="#00F5FF" strokeWidth="0.5" />
          </g>

          {/* Glowing Nodes with Depth & Random Glow */}
          {meshPoints.map((point, i) => (
            <g key={i}>
              {/* Node Label (Optional/Subtle) */}
              <motion.text
                x={point.x}
                y={point.y}
                dy="-10"
                textAnchor="middle"
                fill="#00F5FF"
                fontSize="6"
                className="font-mono opacity-10"
                animate={{ opacity: [0.05, 0.15, 0.05] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.2 }}
              >
                {point.label}
              </motion.text>

              <motion.circle
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill="#00F5FF"
                filter="url(#nodeGlow)"
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.1, 0.4, 0.1],
                  fill: i % 3 === 0 ? ['#00F5FF', '#fff', '#00F5FF'] : '#00F5FF'
                }}
                transition={{ 
                  duration: 2.5 + Math.random() * 2, 
                  repeat: Infinity,
                  delay: Math.random() * 2 
                }}
              />
              
              {/* Pulse Ring */}
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="4"
                stroke="#00F5FF"
                strokeWidth="0.2"
                fill="none"
                animate={{ opacity: [0.05, 0.2, 0.05] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            </g>
          ))}
        </motion.g>
      </svg>

      {/* Scanning Horizontal Line with Glow Trail */}
      <motion.div 
        className="absolute left-0 right-0 z-40 pointer-events-none"
        animate={{ top: ['15%', '85%', '15%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-[2px] w-full bg-primary/40 shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
        <div className="h-[40px] w-full bg-gradient-to-b from-primary/5 to-transparent opacity-10" />
      </motion.div>

      {/* Global Vignette and Scan Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020305] via-transparent to-[#020305] z-20 pointer-events-none opacity-90" />
      
      {/* Scan Lines Textures */}
      <div className="absolute inset-0 opacity-[0.01] z-30 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00F5FF 3px)' }}
      />
    </div>
  );
};

export default BackgroundFX;
