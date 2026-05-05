import React from 'react';
import { motion } from 'framer-motion';

const DetectionCore = ({ children, title, status = 'idle' }) => {
  return (
    <div className="relative w-full max-w-4xl mx-auto mt-8">
      {/* Container with neon glow based on status */}
      <div 
        className={`relative glass-panel rounded-xl p-8 overflow-hidden transition-all duration-500
          ${status === 'scanning' ? 'neon-border' : ''}
          ${status === 'fake' ? 'neon-border-red' : ''}
          ${status === 'idle' ? 'border border-white/10' : ''}
        `}
      >
        {/* Header inside core */}
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-mono text-white tracking-widest">{title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400 uppercase">STATUS:</span>
            <span 
              className={`text-xs font-mono px-2 py-1 rounded bg-black/50 border transition-colors duration-300
                ${status === 'scanning' ? 'text-cyber-blue border-cyber-blue/30' : ''}
                ${status === 'fake' ? 'text-alert-red border-alert-red/30' : ''}
                ${status === 'idle' ? 'text-gray-400 border-white/10' : ''}
              `}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Scanning Animation Overlay */}
        {status === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute w-full h-[2px] bg-cyber-blue shadow-[0_0_15px_rgba(0,212,255,0.8)] animate-scanline"></div>
            <div className="absolute inset-0 bg-cyber-blue/5"></div>
          </div>
        )}
      </div>

      {/* Decorative tech elements */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-cyber-blue/50"></div>
      <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-cyber-blue/50"></div>
      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-cyber-blue/50"></div>
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-cyber-blue/50"></div>
    </div>
  );
};

export default DetectionCore;
