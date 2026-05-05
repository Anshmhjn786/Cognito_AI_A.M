import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, AlertTriangle, FastForward, Rewind } from 'lucide-react';
import DetectionCore from '../components/DetectionCore';
import { TimelineDisturbance } from '../components/Visualizer';

const VidX = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, scanning, fake
  const [activeFrame, setActiveFrame] = useState(null);

  const frames = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    anomaly: i === 3 || i === 4 ? true : false,
    confidence: i === 3 || i === 4 ? 94 + Math.random() * 5 : 10 + Math.random() * 10
  }));

  const startAnalysis = () => {
    setStatus('scanning');
    setIsPlaying(true);
    setTimeout(() => {
      setStatus('fake');
      setIsPlaying(false);
    }, 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col gap-6 mt-8 max-w-5xl mx-auto"
    >
      <DetectionCore title="VidX // Video Deepfake Analysis" status={status}>
        
        {/* Custom Video Player Wrapper */}
        <div className="relative w-full aspect-video bg-black/80 rounded-t-lg border border-white/10 overflow-hidden flex items-center justify-center">
          {status === 'idle' && (
            <button 
              onClick={startAnalysis}
              className="absolute z-10 w-20 h-20 bg-cyber-blue/20 rounded-full flex items-center justify-center hover:bg-cyber-blue/30 transition-colors border border-cyber-blue/50"
            >
              <Play size={32} className="text-cyber-blue ml-2" />
            </button>
          )}

          {/* Mock Video Content */}
          <div className="font-mono text-gray-600 tracking-widest text-xl">
            [ SECURE_VIDEO_STREAM_ACTIVE ]
          </div>

          {/* Fake Detection Overlay */}
          {status === 'fake' && (
            <div className="absolute top-4 right-4 bg-alert-red/20 border border-alert-red backdrop-blur-md px-4 py-2 rounded-md flex items-center gap-2">
              <AlertTriangle size={16} className="text-alert-red" />
              <span className="text-alert-red font-mono text-sm">MANIPULATION DETECTED</span>
            </div>
          )}
        </div>

        {/* Video Controls & Timeline */}
        <div className="bg-charcoal border-x border-b border-white/10 rounded-b-lg p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-cyber-blue transition-colors">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Rewind size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <FastForward size={20} />
            </button>
            
            <div className="flex-grow">
              <TimelineDisturbance isScanning={status === 'scanning'} />
            </div>
          </div>
        </div>

      </DetectionCore>

      {/* Frame Strip Analysis */}
      {status === 'fake' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card mt-4"
        >
          <h3 className="font-mono text-sm tracking-wider text-white border-b border-white/10 pb-2 mb-4">FRAME-BY-FRAME ANALYSIS</h3>
          
          <div className="flex gap-2 overflow-x-auto pb-4">
            {frames.map((frame) => (
              <div 
                key={frame.id}
                onClick={() => setActiveFrame(frame)}
                className={`flex-shrink-0 w-32 cursor-pointer transition-all ${activeFrame?.id === frame.id ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}
              >
                <div className={`aspect-video bg-black/50 border rounded-t-md flex items-center justify-center text-xs font-mono
                  ${frame.anomaly ? 'border-alert-red/50 text-alert-red/50' : 'border-white/10 text-gray-600'}
                  ${activeFrame?.id === frame.id && frame.anomaly ? 'shadow-[0_0_15px_rgba(255,51,51,0.4)] border-alert-red' : ''}
                  ${activeFrame?.id === frame.id && !frame.anomaly ? 'shadow-[0_0_15px_rgba(0,212,255,0.4)] border-cyber-blue' : ''}
                `}>
                  FRAME {frame.id}
                </div>
                <div className={`text-[10px] font-mono p-1 text-center rounded-b-md ${frame.anomaly ? 'bg-alert-red/20 text-alert-red' : 'bg-white/5 text-gray-400'}`}>
                  CONF: {frame.confidence.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>

          {activeFrame && (
            <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/5 flex items-start gap-4">
              <div className="w-1/3 aspect-video bg-black/80 border border-white/10 rounded flex items-center justify-center text-xs font-mono text-gray-500">
                FRAME {activeFrame.id} DATA
              </div>
              <div>
                <h4 className={`font-mono text-sm mb-2 ${activeFrame.anomaly ? 'text-alert-red' : 'text-cyber-blue'}`}>
                  {activeFrame.anomaly ? 'ANOMALY DETECTED' : 'FRAME CLEAR'}
                </h4>
                <p className="text-sm font-sans text-gray-400">
                  {activeFrame.anomaly 
                    ? 'Micro-expressions and pixel blending indicate manipulation of the facial region. Temporal inconsistency detected between frame ' + (activeFrame.id - 1) + ' and ' + activeFrame.id + '.'
                    : 'No significant spatial or temporal anomalies detected in this frame.'}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

    </motion.div>
  );
};

export default VidX;
