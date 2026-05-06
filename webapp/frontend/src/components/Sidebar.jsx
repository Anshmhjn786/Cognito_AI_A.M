import React from 'react';
import { Activity, ScanFace, MonitorPlay, Camera, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, path, active = false }) => (
  <Link to={path} className="relative block">
    <motion.div 
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`p-3 relative flex items-center justify-center cursor-pointer group rounded-lg transition-colors duration-300 z-10 ${active ? 'text-primary' : 'text-white/20 hover:text-white/50'}`}
    >
      {/* Active Vertical Glow Line Indicator */}
      {active && (
        <motion.div 
          layoutId="active-line"
          className="absolute -left-[40px] top-1/2 -translate-y-1/2 h-8 w-[2px] bg-primary shadow-[0_0_12px_#00F5FF]"
        />
      )}

      {/* Active Pulse Background */}
      {active && (
        <motion.div 
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-primary/20 rounded-lg blur-md"
        />
      )}

      {/* Hover Soft Glow Box & Ripple */}
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none scale-90 group-hover:scale-100" />

      {/* Minimal Thin-Line Icon */}
      <Icon 
        size={24} 
        strokeWidth={1} 
        className={`relative z-10 transition-all duration-300 ${active ? 'text-primary drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]' : 'group-hover:text-primary/70 group-hover:drop-shadow-[0_0_10px_rgba(0,245,255,0.3)]'}`} 
      />
      
      {/* Premium Floating Tooltip */}
      <div className="absolute left-[calc(100%+32px)] px-4 py-2 bg-[#05070a]/95 backdrop-blur-xl border border-primary/20 text-primary text-[9px] rounded-sm shadow-[0_0_20px_rgba(0,245,255,0.05)] opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0 whitespace-nowrap pointer-events-none z-50 font-mono tracking-[0.3em] uppercase flex items-center gap-2">
        <span className="w-1 h-1 bg-primary/80 rounded-full animate-pulse shadow-[0_0_5px_#00F5FF]" />
        {label}
      </div>
    </motion.div>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="fixed left-0 top-0 h-full w-24 flex flex-col items-center py-12 border-r border-white/5 bg-[#010102]/60 backdrop-blur-3xl z-50">
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="mb-16 relative group cursor-pointer"
      >
        {/* Faint Glow Halo behind logo */}
        <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Engineered Brand Core */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* Technical Frame - Corner Accents */}
          <div className="absolute inset-0 border border-primary/20 rounded-sm" />
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/60" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/60" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/60" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/60" />
          
          <motion.div 
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-primary font-orbitron font-bold text-xl tracking-tighter"
          >
            C<span className="text-[10px] align-top opacity-60">+</span>
          </motion.div>

          {/* Subtitle / Version */}
          <div className="absolute -bottom-6 left-0 w-full text-center">
            <span className="text-[7px] font-mono text-primary/30 tracking-[0.3em] uppercase">V.04</span>
          </div>
        </div>
      </motion.div>
      
      <div className="flex flex-col gap-8 w-full px-6">
        <SidebarItem icon={Activity} label="System Core" path="/" active={currentPath === '/'} />
        <SidebarItem icon={ScanFace} label="Image Analysis" path="/image" active={currentPath === '/image'} />
        <SidebarItem icon={MonitorPlay} label="Video Feed" path="/video" active={currentPath === '/video'} />
        <SidebarItem icon={Camera} label="Realtime Analysis" path="/realtime" active={currentPath === '/realtime'} />
        <SidebarItem icon={BookOpen} label="Research Insights" path="/research" active={currentPath === '/research'} />
      </div>

      <div className="mt-auto">
        <div className="w-1 h-12 bg-gradient-to-b from-primary/30 to-transparent rounded-full opacity-30" />
      </div>
    </div>
  );
};

export default Sidebar;

