import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Video } from 'lucide-react';

const VideoUploader = ({ onUpload, isProcessing }) => {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <motion.label
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer group ${isProcessing ? 'border-white/5 bg-white/[0.01] pointer-events-none' : 'border-primary/20 bg-primary/[0.02] hover:border-primary/40 hover:bg-primary/[0.04]'}`}
    >
      <input type="file" className="hidden" onChange={handleFileChange} accept="video/*" disabled={isProcessing} />
      
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all ${isProcessing ? 'bg-white/5 text-white/10' : 'bg-primary/10 text-primary group-hover:scale-110'}`}>
        <Video className="w-6 h-6" />
      </div>

      <div className="text-center">
        <h3 className="text-[10px] font-orbitron tracking-[0.2em] uppercase text-white mb-1">
          {isProcessing ? 'Analysis in Progress' : 'Temporal Input'}
        </h3>
        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
          {isProcessing ? 'Processing frame buffer...' : 'Drop video for analysis'}
        </p>
      </div>
    </motion.label>
  );
};

export default VideoUploader;
