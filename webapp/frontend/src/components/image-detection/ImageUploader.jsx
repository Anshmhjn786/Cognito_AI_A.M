import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus } from 'lucide-react';

const ImageUploader = ({ onUpload, isIdle }) => {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <motion.label
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group ${isIdle ? 'border-primary/20 bg-primary/[0.02] hover:border-primary/50' : 'border-white/5 bg-white/[0.01] pointer-events-none'}`}
    >
      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={!isIdle} />
      
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all ${isIdle ? 'bg-primary/10 text-primary group-hover:scale-110' : 'bg-white/5 text-white/10'}`}>
        <Plus className="w-6 h-6" />
      </div>

      <div className="text-center px-6">
        <p className={`text-[10px] font-orbitron tracking-widest uppercase mb-1 ${isIdle ? 'text-white' : 'text-white/20'}`}>
          {isIdle ? 'Analyze Image' : 'Processing...'}
        </p>
        <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Drop source here</p>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-white/10" />
      <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-white/10" />
      <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-white/10" />
      <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-white/10" />
    </motion.label>
  );
};

export default ImageUploader;
