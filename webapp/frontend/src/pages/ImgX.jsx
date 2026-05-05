import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import DetectionCore from '../components/DetectionCore';
import { FrequencyGraph, HeatmapOverlay } from '../components/Visualizer';

const ImgX = () => {
  const [status, setStatus] = useState('idle'); // idle, scanning, fake, real
  const [showHeatmap, setShowHeatmap] = useState(false);

  const simulateScan = () => {
    setStatus('scanning');
    setShowHeatmap(false);
    setTimeout(() => {
      setStatus('fake');
      setShowHeatmap(true);
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5 }}
      className="w-full flex gap-6 mt-8"
    >
      {/* Main Detection Area */}
      <div className="flex-grow">
        <DetectionCore title="ImgX // Image Forensics" status={status}>
          <div 
            className="w-full h-[500px] border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center relative overflow-hidden bg-black/20"
            onClick={status === 'idle' ? simulateScan : undefined}
          >
            {status === 'idle' && (
              <div className="text-center cursor-pointer hover:text-cyber-blue transition-colors group">
                <UploadCloud size={48} className="mx-auto mb-4 text-gray-500 group-hover:text-cyber-blue transition-colors" />
                <p className="text-lg font-mono mb-2">Initialize Image Data</p>
                <p className="text-sm text-gray-500 font-sans">Drag & drop or click to analyze</p>
              </div>
            )}

            {(status === 'scanning' || status === 'fake' || status === 'real') && (
              <div className="absolute inset-0 w-full h-full">
                {/* Mock Image analyzed */}
                <div className="w-full h-full bg-charcoal flex items-center justify-center text-gray-500 font-mono">
                  [ MOCK_IMAGE_DATA_001.JPG ]
                </div>
                
                {/* Visualizer Overlay */}
                <HeatmapOverlay isVisible={showHeatmap} isFake={status === 'fake'} />
                
                {/* Result Overlay */}
                {status === 'fake' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-alert-red/10 flex items-center justify-center backdrop-blur-[2px]"
                  >
                    <div className="glass-panel p-6 rounded-xl border border-alert-red flex flex-col items-center shadow-[0_0_30px_rgba(255,51,51,0.3)]">
                      <AlertTriangle size={48} className="text-alert-red mb-4" />
                      <h3 className="text-2xl font-black text-alert-red mb-2 tracking-widest">SYNTHETIC MEDIA DETECTED</h3>
                      <p className="text-white font-mono text-sm">Confidence Level: 98.4%</p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </DetectionCore>
      </div>

      {/* Side Panels */}
      <div className="w-80 flex flex-col gap-6">
        {/* Frequency Analysis Panel */}
        <div className="bento-card">
          <div className="flex items-center gap-2 mb-4 text-cyber-blue border-b border-white/10 pb-2">
            <Activity size={18} />
            <h3 className="font-mono text-sm tracking-wider">FREQUENCY DIST</h3>
          </div>
          <FrequencyGraph isScanning={status === 'scanning'} />
          <div className="mt-4 flex justify-between text-xs font-mono text-gray-400">
            <span>0 Hz</span>
            <span>NOISE PATTERN</span>
            <span>Nyquist</span>
          </div>
        </div>

        {/* Tools Panel */}
        <div className="bento-card">
          <h3 className="font-mono text-sm tracking-wider text-white border-b border-white/10 pb-2 mb-4">ANALYSIS TOOLS</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-sans text-gray-300">Heatmap Overlay</span>
              <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                disabled={status === 'idle'}
                className={`w-12 h-6 rounded-full transition-colors relative ${showHeatmap ? 'bg-cyber-blue' : 'bg-gray-700'} ${status === 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${showHeatmap ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            
            <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
              <span className="text-sm font-sans text-gray-300">ELA Analysis</span>
              <button className="w-12 h-6 rounded-full bg-gray-700 relative">
                <div className="w-4 h-4 rounded-full bg-white absolute top-1 left-1"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImgX;
