import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, AlertCircle, Search, Download, ChevronRight } from 'lucide-react';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const scrollRef = useRef(null);

  const logTypes = ['INFO', 'WARN', 'ALERT', 'CRITICAL'];
  const systems = ['AUTH_GATEWAY', 'NEURAL_ENGINE', 'IMAGE_PROC', 'VIDEO_STREAM', 'DB_ACCESS'];

  useEffect(() => {
    // Generate initial logs
    const initialLogs = Array.from({ length: 20 }).map(() => generateLog());
    setLogs(initialLogs);

    // Stream logs
    const interval = setInterval(() => {
      setLogs(prev => [...prev.slice(-49), generateLog()]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const generateLog = () => {
    const type = logTypes[Math.floor(Math.random() * logTypes.length)];
    const system = systems[Math.floor(Math.random() * systems.length)];
    const id = Math.random().toString(36).substr(2, 9).toUpperCase();
    return {
      id,
      timestamp: new Date().toLocaleTimeString(),
      type,
      system,
      message: getMessage(type, system),
    };
  };

  const getMessage = (type, system) => {
    const messages = {
      INFO: [`Session initialized on ${system}`, `Cache cleared`, `Handshake successful`],
      WARN: [`High latency detected in ${system}`, `Resource spike`, `Retry attempt 1`],
      ALERT: [`Unauthorized access attempt blocked`, `Signature mismatch`, `Pattern anomaly`],
      CRITICAL: [`Kernel panic prevented`, `Neural sync failure`, `Database breach attempt blocked`],
    };
    return messages[type][Math.floor(Math.random() * messages[type].length)];
  };

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.type === filter);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      
      <div className="absolute inset-0 z-10 flex flex-col w-full h-full text-white font-inter p-6 pr-12 gap-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center w-full pb-4 border-b border-white/5 tracking-[0.2em] uppercase text-[10px] font-mono">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-primary/90">SYSTEM_LOGS &middot; KERNEL_STREAM</span>
          </div>
          <div className="flex items-center gap-6 text-gray-500">
            <span>UPTIME / 14:22:09</span>
            <span className="text-white/60">SYNCED_WITH_CORE</span>
          </div>
        </div>

        <div className="flex w-full flex-1 gap-8 relative overflow-hidden">
          
          {/* Main Log Area */}
          <div className="flex-1 flex flex-col border border-white/5 bg-black/40 backdrop-blur-md rounded-xl overflow-hidden">
            
            {/* Log Controls */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex gap-2">
                {['ALL', ...logTypes].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-3 py-1 rounded text-[8px] font-mono border transition-all ${
                      filter === t 
                        ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(0,245,255,0.2)]' 
                        : 'border-white/10 text-gray-500 hover:border-white/20'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search logs..." 
                    className="bg-black/40 border border-white/10 rounded px-8 py-1 text-[9px] font-mono focus:outline-none focus:border-primary/40 w-48"
                  />
                </div>
                <button className="p-1.5 border border-white/10 rounded hover:bg-white/5 transition-colors">
                  <Download className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Log Stream */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1.5 scrollbar-thin scrollbar-thumb-primary/10"
            >
              <AnimatePresence initial={false}>
                {filteredLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 group hover:bg-white/5 py-0.5 transition-colors"
                  >
                    <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                    <span className={`shrink-0 w-16 ${
                      log.type === 'CRITICAL' ? 'text-red-500' :
                      log.type === 'ALERT' ? 'text-orange-500' :
                      log.type === 'WARN' ? 'text-yellow-500' :
                      'text-primary'
                    }`}>[{log.type}]</span>
                    <span className="text-gray-400 shrink-0 w-24">[{log.system}]</span>
                    <span className="text-white/80">{log.message}</span>
                    <span className="ml-auto text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">ID_{log.id}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Status Bar */}
            <div className="p-2 border-t border-white/5 bg-black/40 flex items-center justify-between px-4">
              <div className="flex items-center gap-4 text-[8px] font-mono text-gray-500">
                <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary animate-pulse"/> SYSTEM_OK</span>
                <span>PACKET_IN: 142kb/s</span>
                <span>DROPPED: 0</span>
              </div>
              <div className="text-[8px] font-mono text-primary/40">SECURE_CHANNEL_AES256</div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="w-72 flex flex-col gap-6">
            <div className="border border-white/5 bg-black/40 backdrop-blur-md rounded-xl p-5">
              <h3 className="text-[9px] font-mono text-primary/70 uppercase tracking-widest mb-4">Security Overview</h3>
              <div className="space-y-4">
                {[
                  { label: 'Neural Integrity', val: 99.4, status: 'STABLE' },
                  { label: 'Firewall Strength', val: 100, status: 'MAX' },
                  { label: 'Latency', val: 12, status: 'OPTIMAL' },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[8px] font-mono">
                      <span className="text-white/40">{stat.label}</span>
                      <span className="text-primary">{stat.status}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/40" style={{ width: `${stat.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 border border-primary/5 bg-primary/5 rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <Shield className="w-12 h-12 text-primary opacity-20 mb-4" strokeWidth={1} />
              <div className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.2em] mb-2">Encrypted session</div>
              <p className="text-[8px] text-gray-500 font-mono">All logs are signed and verified via the Cognito decentralized ledger.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SystemLogs;
