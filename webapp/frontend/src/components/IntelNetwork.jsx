import React from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Shield, Zap, Activity } from 'lucide-react';

const IntelNetwork = () => {
  const nodes = [
    { id: 'CN-AX23', location: 'Tokyo', status: 'ACTIVE', risk: 'HIGH', x: 75, y: 35, color: '#00F5FF' },
    { id: 'EU-BR91', location: 'Berlin', status: 'MONITORING', risk: 'LOW', x: 48, y: 28, color: '#00F5FF' },
    { id: 'US-NY77', location: 'New York', status: 'ALERT', risk: 'CRITICAL', x: 25, y: 32, color: '#FF4D4D' },
    { id: 'IN-DL55', location: 'Delhi', status: 'ACTIVE', risk: 'MEDIUM', x: 65, y: 45, color: '#FACC15' },
    { id: 'UK-LN12', location: 'London', status: 'ACTIVE', risk: 'LOW', x: 45, y: 25, color: '#00F5FF' },
  ];

  const feedItems = [
    "Deepfake anomaly detected in EU region...",
    "Facial inconsistency flagged in Tokyo cluster...",
    "Temporal mismatch detected in US-East video stream...",
    "Neural pattern variance exceeding threshold in Delhi...",
    "Metadata spoofing attempt blocked by UK-Gateway...",
    "Global detection accuracy stabilizing at 93%...",
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      
      <div className="absolute inset-0 z-10 flex flex-col w-full h-full text-white font-inter p-6 pr-12 gap-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center w-full pb-4 border-b border-white/5 tracking-[0.2em] uppercase text-[10px] font-mono">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-primary/90">INTEL NETWORK &middot; GLOBAL SURVEILLANCE</span>
          </div>
          <div className="flex items-center gap-6 text-gray-500">
            <span>NODES / 1,422 ACTIVE</span>
            <span className="text-white/60">GRID STATUS: OPTIMAL</span>
          </div>
        </div>

        <div className="flex w-full flex-1 gap-8 relative">
          
          {/* LEFT: Map & Feed */}
          <div className="flex-[2] flex flex-col gap-6">
            
            {/* World Map Simulation */}
            <div className="flex-1 border border-white/5 bg-black/40 backdrop-blur-md rounded-xl relative overflow-hidden flex items-center justify-center group">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #00F5FF 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              
              {/* Map Placeholder Graphic */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <Globe size={400} strokeWidth={0.5} className="text-primary" />
              </div>

              {/* Nodes */}
              <svg className="absolute inset-0 w-full h-full">
                {nodes.map((node, i) => (
                  <g key={node.id}>
                    {/* Connection Lines (Fake) */}
                    {i > 0 && (
                      <motion.line
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.1 }}
                        transition={{ duration: 2, delay: i * 0.5 }}
                        x1={`${nodes[i-1].x}%`} y1={`${nodes[i-1].y}%`}
                        x2={`${node.x}%`} y2={`${node.y}%`}
                        stroke="#00F5FF" strokeWidth="1" strokeDasharray="4 4"
                      />
                    )}
                    
                    {/* Node Dot */}
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.5 }}
                      cx={`${node.x}%`} cy={`${node.y}%`} r="4"
                      fill={node.color}
                      className="cursor-pointer shadow-[0_0_15px_rgba(0,245,255,0.8)]"
                    />
                    <motion.circle
                      animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      cx={`${node.x}%`} cy={`${node.y}%`} r="6"
                      stroke={node.color} strokeWidth="1" fill="none"
                    />
                  </g>
                ))}
              </svg>

              <div className="absolute top-4 left-4 flex flex-col gap-1">
                <h2 className="text-xl font-orbitron font-bold tracking-widest text-white/90">MONITORING GRID</h2>
                <p className="text-[8px] font-mono text-primary/50 tracking-[0.3em] uppercase">Active Neural Network Mapping</p>
              </div>
            </div>

            {/* Live Feed */}
            <div className="h-32 border border-white/5 bg-black/60 backdrop-blur-md rounded-xl p-4 overflow-hidden relative">
              <div className="text-[8px] font-mono text-primary/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap className="w-2 h-2" /> Live Intel Stream
              </div>
              <div className="flex flex-col gap-2">
                <motion.div 
                  animate={{ y: [0, -150] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="flex flex-col gap-2"
                >
                  {[...feedItems, ...feedItems].map((item, i) => (
                    <div key={i} className="text-[10px] font-mono text-white/40 flex items-center gap-3">
                      <span className="text-primary/30">[{new Date().toLocaleTimeString()}]</span>
                      <span className={item.includes('flagged') || item.includes('detected') ? 'text-primary/70' : ''}>{item}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
              {/* Vignette */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            </div>
          </div>

          {/* RIGHT: Stats & Active Nodes */}
          <div className="w-80 flex flex-col gap-6">
            
            {/* Active Nodes List */}
            <div className="flex-1 border border-white/5 bg-black/40 backdrop-blur-md rounded-xl p-5">
              <h3 className="text-[10px] font-mono text-primary/70 uppercase tracking-widest mb-6">Regional Node Status</h3>
              <div className="flex flex-col gap-4">
                {nodes.map((node) => (
                  <div key={node.id} className="p-3 bg-white/5 border border-white/5 rounded flex flex-col gap-2 group hover:border-primary/20 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-white/80">{node.id} &middot; {node.location}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-sm font-bold ${
                        node.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                        node.risk === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                        'bg-primary/20 text-primary'
                      }`}>
                        {node.risk}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: node.risk === 'CRITICAL' ? '95%' : node.risk === 'HIGH' ? '70%' : '30%' }}
                          className={`h-full ${node.risk === 'CRITICAL' ? 'bg-red-500' : node.risk === 'HIGH' ? 'bg-orange-500' : 'bg-primary'}`}
                        />
                      </div>
                      <span className="text-[8px] font-mono text-white/30 uppercase">{node.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Health */}
            <div className="h-48 border border-white/5 bg-black/40 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-[10px] font-mono text-primary/70 uppercase tracking-widest mb-2">Network Metrics</h3>
              {[
                { label: 'Signal Strength', val: 87, color: 'primary' },
                { label: 'Detection Accuracy', val: 93, color: 'primary' },
                { label: 'Network Stability', val: 98, color: 'primary' }
              ].map((metric) => (
                <div key={metric.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-white/40">{metric.label}</span>
                    <span className="text-primary">{metric.val}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.val}%` }}
                      className="h-full bg-primary shadow-[0_0_8px_#00F5FF]"
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default IntelNetwork;
