import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Database, Cpu, Activity, Clock, Server } from 'lucide-react';

const SystemLogs = () => {
  const [logs, setLogs] = useState([
    { id: 1, type: 'INFO', msg: 'Neural Detection Engine v4.2.0 initialized', time: '14:30:05' },
    { id: 2, type: 'INFO', msg: 'Core weights loaded into GPU VRAM (8.2GB)', time: '14:30:08' },
    { id: 3, type: 'INFO', msg: 'System integrity check: OPTIMAL', time: '14:30:12' },
    { id: 4, type: 'WARNING', msg: 'Minor latency detected in Delhi node (142ms)', time: '14:31:45' },
    { id: 5, type: 'INFO', msg: 'Auto-scaling inference workers to 4 instances', time: '14:32:01' },
  ]);

  const logEndRef = useRef(null);

  const logMessages = [
    { type: 'INFO', msg: 'New image scan initiated from session 4A91' },
    { type: 'INFO', msg: 'Extracting high-frequency spectral features...' },
    { type: 'WARNING', msg: 'Blur artifact detected in ROI [241, 582]' },
    { type: 'INFO', msg: 'GradCAM visualization computed successfully' },
    { type: 'ALERT', msg: 'Anomalous facial structure detected: 94.2% match' },
    { type: 'INFO', msg: 'Logging forensic report to vault...' },
    { type: 'INFO', msg: 'Garbage collection complete: 142MB released' },
    { type: 'INFO', msg: 'Real-time video feed synchronized with Tokyo node' },
    { type: 'ALERT', msg: 'Potential adversarial noise detected in channel B' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomLog = logMessages[Math.floor(Math.random() * logMessages.length)];
      setLogs(prev => [...prev, {
        id: Date.now(),
        type: randomLog.type,
        msg: randomLog.msg,
        time: new Date().toLocaleTimeString().split(' ')[0]
      }].slice(-20)); // Keep last 20 logs
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col w-full h-full text-white font-inter p-6 pr-12 gap-6 relative overflow-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-center w-full pb-4 border-b border-white/5 tracking-[0.2em] uppercase text-[10px] font-mono">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-primary/90">SYSTEM LOGS &middot; AI ENGINE ACTIVITY</span>
        </div>
        <div className="flex items-center gap-6 text-gray-500">
          <span>RUNNING TIME: 42:15:08</span>
          <span className="text-white/60">KERNEL: v4.11-STABLE</span>
        </div>
      </div>

      <div className="flex w-full flex-1 gap-8 relative">
        
        {/* LEFT: Terminal Logs */}
        <div className="flex-[3] flex flex-col border border-white/5 bg-black/60 backdrop-blur-md rounded-xl overflow-hidden relative shadow-2xl">
          {/* Terminal Header */}
          <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
            <div className="text-[8px] font-mono text-white/30 tracking-widest uppercase">
              root@cognito-ai:~# tail -f /var/log/inference.log
            </div>
          </div>

          {/* Log List */}
          <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] flex flex-col gap-2 scrollbar-hide">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-4 items-start"
                >
                  <span className="text-white/20 shrink-0">[{log.time}]</span>
                  <span className={`shrink-0 font-bold ${
                    log.type === 'INFO' ? 'text-cyan-400' :
                    log.type === 'WARNING' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-white/70">{log.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logEndRef} />
          </div>

          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20" />
        </div>

        {/* RIGHT: Timeline & Stats */}
        <div className="w-96 flex flex-col gap-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'CPU LOAD', val: '42%', icon: Cpu },
              { label: 'GPU VRAM', val: '68%', icon: Database },
              { label: 'QUERIES', val: '128', icon: Activity },
              { label: 'MODELS', val: '2', icon: Server }
            ].map((stat) => (
              <div key={stat.label} className="p-4 border border-white/5 bg-black/40 backdrop-blur-md rounded-xl flex flex-col gap-2">
                <stat.icon className="w-3 h-3 text-primary/40" />
                <div className="text-lg font-orbitron font-bold text-white/90">{stat.val}</div>
                <div className="text-[7px] font-mono text-primary/30 uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Session Timeline */}
          <div className="flex-1 border border-white/5 bg-black/40 backdrop-blur-md rounded-xl p-5 flex flex-col">
            <h3 className="text-[10px] font-mono text-primary/70 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Event Timeline
            </h3>
            <div className="flex flex-col gap-6 relative flex-1">
              {/* Vertical line */}
              <div className="absolute left-[5px] top-1 bottom-1 w-[1px] bg-white/10" />
              
              {[
                { time: '14:32:01', event: 'Image Uploaded', status: 'COMPLETED' },
                { time: '14:32:03', event: 'Landmark Mapping', status: 'COMPLETED' },
                { time: '14:32:05', event: 'Explainability GEN', status: 'COMPLETED' },
                { time: '14:32:06', event: 'Final Inference', status: 'DONE' },
                { time: '14:35:12', event: 'Buffer Flush', status: 'WAITING' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className={`w-2.5 h-2.5 rounded-full border border-black z-10 shrink-0 mt-1 ${item.status === 'WAITING' ? 'bg-white/10' : 'bg-primary'}`} />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-white/80">{item.event}</span>
                    <div className="flex justify-between w-48 text-[7px] font-mono uppercase tracking-widest">
                      <span className="text-white/20">{item.time}</span>
                      <span className={item.status === 'DONE' ? 'text-primary' : 'text-white/40'}>{item.status}</span>
                    </div>
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

export default SystemLogs;
