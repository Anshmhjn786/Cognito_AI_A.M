import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const RootLayout = () => {
  return (
    <div className="relative min-h-screen bg-obsidian text-white overflow-hidden flex flex-col">
      {/* Abstract Background - Neural Network Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyber-blue/10 via-obsidian to-obsidian"></div>
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>

      <Navbar />

      <main className="relative z-10 flex-grow pt-24 px-6 pb-12 w-full max-w-[1400px] mx-auto flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
