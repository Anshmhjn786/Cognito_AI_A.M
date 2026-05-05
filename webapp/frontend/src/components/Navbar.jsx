import { NavLink } from 'react-router-dom';
import { Shield, Image as ImageIcon, Video, FileText, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const navLinks = [
    { name: 'Home', path: '/', icon: <Shield size={18} /> },
    { name: 'ImgX', path: '/imgx', icon: <ImageIcon size={18} /> },
    { name: 'VidX', path: '/vidx', icon: <Video size={18} /> },
    { name: 'Research', path: '/research', icon: <FileText size={18} /> },
    { name: 'About', path: '/about', icon: <Info size={18} /> },
  ];

  return (
    <header className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center glass-panel border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-cyber-blue flex items-center justify-center text-obsidian shadow-[0_0_15px_rgba(0,212,255,0.6)]">
          <Shield size={20} className="stroke-[2.5px]" />
        </div>
        <h1 className="text-xl font-mono font-bold tracking-wider text-glow">COGNITO<span className="text-cyber-blue">.AI</span></h1>
      </div>
      
      <nav className="flex items-center gap-6">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `relative px-3 py-2 flex items-center gap-2 text-sm uppercase tracking-widest transition-all duration-300 ${
                isActive ? 'text-cyber-blue text-glow' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {link.icon}
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-cyber-blue shadow-[0_0_8px_rgba(0,212,255,0.8)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-cyber-blue/80 px-3 py-1.5 rounded-full border border-cyber-blue/20 bg-cyber-blue/5">
          <span className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse"></span>
          SYS.ONLINE
        </div>
      </div>
    </header>
  );
};

export default Navbar;
