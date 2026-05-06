import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

const BackgroundFX = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 40, stiffness: 60, restDelta: 0.001 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

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


  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#020305]">
      {/* Background Face - Full head down to neck position */}
      <motion.div 
        style={{ 
          x: springX, 
          y: springY,
          scale: 1.1,
        }}
        className="absolute right-0 top-0 h-full w-[55%] z-0"
      >
        <motion.div 
          className="absolute inset-0 bg-no-repeat mix-blend-screen opacity-100"
          style={{
            backgroundImage: `url('/face2.jpeg')`,
            backgroundPosition: 'right center',
            backgroundSize: '110% auto',
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
        {/* Soft Vignette Overlay directly on face layer - Expanded to prevent edge reveal */}
        <div className="absolute -inset-10 bg-gradient-to-r from-[#020305] via-transparent to-transparent opacity-95" />
        <div className="absolute -inset-10 bg-gradient-to-b from-[#020305]/70 via-transparent to-[#020305]/95" />
      </motion.div>


      {/* Scanning Horizontal Line with Glow Trail */}
      <motion.div 
        className="absolute left-0 right-0 z-40 pointer-events-none"
        animate={{ top: ['-5%', '95%', '-5%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-[2px] w-full bg-primary/50 shadow-[0_0_14px_rgba(0,245,255,0.7)]" />
        <div className="h-[60px] w-full bg-gradient-to-b from-primary/10 to-transparent opacity-20" />
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
