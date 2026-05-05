import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Users, Code, Globe, Shield } from 'lucide-react';

const TiltCard = ({ children, className }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`bento-card ${className} hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]`}
    >
      <div style={{ transform: "translateZ(30px)" }} className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

const About = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto mt-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <Shield size={36} className="text-white" />
        <h2 className="text-3xl font-black font-sans text-white tracking-tight">PROJECT <span className="text-gray-500">INITIATIVE</span></h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[200px]">
        
        {/* Mission Statement */}
        <TiltCard className="col-span-1 md:col-span-3 row-span-2 bg-charcoal/80">
          <div className="flex flex-col h-full justify-center max-w-2xl">
            <h3 className="text-2xl font-black text-white mb-4">Securing the Digital Frontier</h3>
            <p className="text-gray-400 font-sans leading-relaxed text-lg mb-6">
              As generative AI models reach photorealism, the line between truth and synthesis blurs. Cognito AI was founded to provide an enterprise-grade defense mechanism against malicious synthetic media, identity theft, and automated misinformation campaigns.
            </p>
            <div className="flex gap-4">
              <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-gray-300">TRUSTED</span>
              <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-gray-300">VERIFIED</span>
              <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-gray-300">OPEN-SOURCE CORE</span>
            </div>
          </div>
        </TiltCard>

        {/* Team Stats */}
        <TiltCard className="col-span-1 row-span-1 flex flex-col items-center justify-center text-center">
          <Users size={32} className="text-cyber-blue mb-3" />
          <h4 className="text-3xl font-black text-white">12</h4>
          <p className="text-xs font-mono text-gray-500 mt-1">RESEARCHERS</p>
        </TiltCard>

        {/* Global Nodes */}
        <TiltCard className="col-span-1 row-span-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
             <Globe size={150} className="absolute -bottom-10 -right-10 text-white" />
          </div>
          <h4 className="text-3xl font-black text-white relative z-10">24/7</h4>
          <p className="text-xs font-mono text-gray-500 mt-1 relative z-10">MONITORING</p>
        </TiltCard>

        {/* Stack */}
        <TiltCard className="col-span-1 md:col-span-4 row-span-1 border-t border-white/10 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <Code size={24} className="text-gray-400" />
            <h3 className="text-lg font-mono text-white">System Stack</h3>
          </div>
          <div className="flex gap-6 font-mono text-sm text-gray-500">
            <span className="hover:text-cyber-blue transition-colors">REACT</span>
            <span>//</span>
            <span className="hover:text-cyber-blue transition-colors">TAILWIND</span>
            <span>//</span>
            <span className="hover:text-cyber-blue transition-colors">FRAMER</span>
            <span>//</span>
            <span className="hover:text-cyber-blue transition-colors">WEBGL</span>
          </div>
        </TiltCard>

      </div>
    </motion.div>
  );
};

export default About;
