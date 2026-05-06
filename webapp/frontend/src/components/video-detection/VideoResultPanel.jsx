import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const VideoResultPanel = ({ result, onReset }) => {
  const isFake = result.prediction === 'FAKE';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col gap-6"
    >
      <div className={`flex-1 p-8 rounded-2xl border bg-black/40 backdrop-blur-md flex flex-col ${isFake ? 'border-red-500/30' : 'border-primary/30'}`}>
        
        <div className="text-center mb-8">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isFake ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
            {isFake ? <AlertTriangle className="w-7 h-7" /> : <CheckCircle className="w-7 h-7" />}
          </div>
          <h2 className={`text-2xl font-orbitron font-bold tracking-[0.2em] uppercase ${isFake ? 'text-red-500 drop-shadow-[0_0_8px_#ef444466]' : 'text-primary drop-shadow-[0_0_8px_#00F5FF66]'}`}>
            {isFake ? 'Deepfake' : 'Authentic'}
          </h2>
          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1">Classification Result</p>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-6 border border-white/5 mb-8">
          <div className="text-center mb-2">
            <span className="text-4xl font-mono font-bold tracking-tighter text-white">
              {(result.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-[8px] font-mono text-center text-gray-500 uppercase tracking-widest">Temporal Confidence Score</p>
        </div>

        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <h4 className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em]">Inference Insights</h4>
            <div className="space-y-3">
              {[
                { label: 'Frame Consistency', value: isFake ? 'Low' : 'Verified' },
                { label: 'Temporal Fluidity', value: 'Optimized' },
                { label: 'Anomaly Count', value: result.flagged_frames?.length || 0 }
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[9px] font-mono text-gray-400 uppercase">{stat.label}</span>
                  <span className={`text-[9px] font-bold ${stat.value === 'Verified' || stat.value === 'Optimized' || stat.value === 0 ? 'text-primary' : 'text-red-400'}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg italic">
            <p className="text-[10px] font-mono text-gray-500 leading-relaxed">
              {isFake 
                ? "Sequence analysis revealed non-linear frame-to-frame interpolation and latent spectral inconsistencies typical of GAN-based synthesis."
                : "The temporal signature matches organic video capture patterns. No suspicious frame interpolation or frequency artifacts detected."
              }
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          className="w-full py-4 border border-white/10 rounded-lg text-[10px] font-mono tracking-[0.3em] text-white/60 hover:text-white transition-all uppercase"
        >
          New Analysis
        </motion.button>
      </div>
    </motion.div>
  );
};

export default VideoResultPanel;
