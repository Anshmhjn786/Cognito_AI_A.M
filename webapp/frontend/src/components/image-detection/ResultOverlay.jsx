import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const ResultOverlay = ({ result, onReset }) => {
  const isFake = result?.prediction === 'FAKE';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col gap-6"
    >
      <div className={`flex-1 border p-8 rounded-2xl bg-black/40 backdrop-blur-md flex flex-col ${isFake ? 'border-red-500/30' : 'border-primary/30'}`}>
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isFake ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
            {isFake ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
          </div>
          <h2 className={`text-xl font-orbitron font-bold tracking-[0.2em] uppercase ${isFake ? 'text-red-500' : 'text-primary'}`}>
            {isFake ? 'Fake' : 'Real'}
          </h2>
          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1">Classification Verdict</p>
        </div>

        {/* CONFIDENCE */}
        <div className="bg-white/[0.03] rounded-xl p-6 border border-white/5 mb-8 text-center">
          <div className="text-4xl font-mono font-bold tracking-tighter text-white mb-1">
            {(result?.confidence * 100).toFixed(1)}%
          </div>
          <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Model Confidence</p>
        </div>

        {/* INSIGHTS */}
        <div className="flex-1 space-y-4">
          <h4 className="text-[8px] font-mono text-white/40 uppercase tracking-[0.3em] mb-4">Forensic Insights</h4>
          {[
            { label: 'Integrity', value: isFake ? 'Compromised' : 'Verified' },
            { label: 'Neural Sync', value: 'High' },
            { label: 'Artifacts', value: isFake ? 'Detected' : 'None' }
          ].map(stat => (
            <div key={stat.label} className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-gray-500 uppercase">{stat.label}</span>
              <span className={`text-[9px] font-bold ${stat.value === 'Verified' || stat.value === 'None' || stat.value === 'High' ? 'text-primary' : 'text-red-400'}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* ACTION */}
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          className="w-full py-4 border border-white/10 rounded-lg text-[10px] font-mono tracking-[0.3em] text-white/60 hover:text-white transition-all uppercase mt-8"
        >
          New Analysis
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ResultOverlay;
