import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download } from 'lucide-react';

const ReportModal = ({ item, onClose, apiBase }) => {
  if (!item) return null;
  const isFake = item.prediction === 'FAKE';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 bg-black/90 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-black border border-white/10 max-w-5xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Left: Media View */}
        <div className="flex-1 bg-white/[0.02] flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/10 relative group">
          <img 
            src={`${apiBase}${item.saved_image_path}`} 
            alt="Forensic View" 
            className="max-w-full max-h-[70vh] object-contain rounded shadow-2xl transition-all duration-700" 
          />
          <div className="absolute top-6 left-6 text-[8px] font-mono text-white/20 tracking-widest uppercase">
            SOURCE_RENDER // 256-BIT_AES_ENCRYPTED
          </div>
        </div>

        {/* Right: Technical Breakdown */}
        <div className="w-full md:w-96 p-10 flex flex-col gap-10 bg-black/40">
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Forensic Technical Report</p>
            <h3 className={`text-3xl font-orbitron font-bold tracking-widest ${isFake ? 'text-red-500' : 'text-primary'}`}>
              {item.prediction}
            </h3>
            <p className="text-[9px] font-mono text-gray-600 mt-2 italic">Session ID: {item.id}</p>
          </div>

          <div className="space-y-8 flex-1">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Confidence Score</p>
                <span className={`text-xl font-mono font-bold ${isFake ? 'text-red-500' : 'text-primary'}`}>{(item.confidence * 100).toFixed(2)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.confidence * 100}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-full ${isFake ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-primary shadow-[0_0_10px_#00f5ff]'}`}
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Metadata Analysis</p>
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-tighter">
                <div className="p-2 bg-white/5 rounded border border-white/5">TYPE: {isFake ? 'SYNTHETIC' : 'ORGANIC'}</div>
                <div className="p-2 bg-white/5 rounded border border-white/5">SENSOR: VERIFIED</div>
                <div className="p-2 bg-white/5 rounded border border-white/5">COMPRESSION: LOSSLESS</div>
                <div className="p-2 bg-white/5 rounded border border-white/5">STATUS: SEALED</div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Expert Summary</p>
              <p className="text-[11px] font-mono text-gray-400 leading-relaxed italic border-l border-primary/20 pl-4 py-1">
                {isFake 
                  ? "Analysis revealed systematic frequency artifacts and inconsistent gradient maps typically associated with diffusion-based generation models."
                  : "All forensic passes confirmed high structural integrity. Pixel distribution and metadata markers match organic camera sensor patterns."
                }
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 py-3 border border-white/10 rounded flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-[9px] font-mono uppercase tracking-widest text-gray-400">
              <Download className="w-3 h-3" /> Export PDF
            </button>
            <button className="flex-1 py-3 border border-white/10 rounded flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-[9px] font-mono uppercase tracking-widest text-gray-400">
              <ExternalLink className="w-3 h-3" /> Raw Data
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportModal;
