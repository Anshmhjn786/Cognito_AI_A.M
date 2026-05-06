import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Film, AlertTriangle, CheckCircle, ScanFace } from 'lucide-react';
import { API_BASE } from '../api_config';

const VideoDetection = () => {
  const [stage, setStage] = useState(0); // 0: Idle, 1-6: Processing stages
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setResult(null);
      startAnalysis(file);
    }
  };

  const startAnalysis = async (file) => {
    setLoading(true);
    setStage(1);
    setActiveFrameIndex(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/predict-video`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      console.log("Video Analysis Result:", data); // Debug Log
      setResult(data);
    } catch (error) {
      console.error("API Error:", error);
      setResult({ status: 'error', error: 'Processing failed' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stage > 0 && stage < 6) {
      let delay = 1500;
      if (stage === 2) delay = 2000; // Loading extraction
      if (stage === 3) delay = 1000; // Grid appears
      if (stage === 4) delay = 3000; // Analysis scanning
      if (stage === 5) delay = 1500; // Aggregation

      // If result is ready and we are at stage 5, move to 6
      if (result && stage === 5) {
        setStage(6);
        return;
      }

      const timer = setTimeout(() => {
        setStage(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [stage, result]);

  // Frame animation for Stage 4 (Analysis)
  useEffect(() => {
    if (stage === 4) {
      const interval = setInterval(() => {
        setActiveFrameIndex(prev => (prev + 1) % 9);
      }, 400); // Move highlight every 400ms
      return () => clearInterval(interval);
    }
  }, [stage]);

  const reset = () => {
    setStage(0);
    setMediaUrl(null);
    setResult(null);
  };

  // Mock grid frames - In real case, backend might flag specific frames
  const frames = Array.from({ length: 9 }).map((_, i) => ({
    id: i,
    isSuspicious: result && result.prediction === 'FAKE' && (i === 2 || i === 5 || i === 7) 
  }));

  return (
    <div className="flex flex-col w-full h-full text-white font-inter relative z-10 p-6 pr-12 gap-6">
      
      {/* HEADER (TOP BAR) */}
      <div className="flex justify-between items-center w-full pb-4 border-b border-white/5 tracking-[0.2em] uppercase text-[10px] font-mono">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_#00F5FF] animate-pulse" />
          <span className="text-primary/90">VIDEO DETECTION &middot; ACTIVE</span>
        </div>
        <div className="flex items-center gap-6 text-gray-500">
          <span>SESSION / READY</span>
          <span className="text-white/60">PIPELINE INITIALIZED</span>
        </div>
      </div>

      <div className="flex w-full flex-1 gap-8 relative overflow-hidden">
        
        {/* LEFT: Upload Panel */}
        <motion.div 
          animate={{ width: stage > 0 ? '15%' : '20%', opacity: stage > 0 ? 0.6 : 1 }}
          className="flex flex-col h-full border border-primary/10 bg-black/80 backdrop-blur-3xl p-6 relative transition-all duration-700"
        >
          <div className="text-[10px] text-primary/70 font-mono tracking-widest uppercase mb-8">
            Input Video
          </div>
          
          <motion.label 
            whileHover={{ scale: 1.02, boxShadow: '0 0 10px rgba(0,245,255,0.05)' }}
            className="flex-1 border border-dashed border-primary/20 rounded-lg flex flex-col items-center justify-center cursor-pointer group hover:border-primary/40 transition-colors bg-black/40"
          >
            <input type="file" accept="video/mp4, video/quicktime, video/x-msvideo" className="hidden" onChange={handleFileUpload} />
            <Film className="w-8 h-8 text-gray-500 mb-4 group-hover:text-primary transition-colors" strokeWidth={1} />
            <p className="text-sm text-gray-400 group-hover:text-white transition-colors">Select Video</p>
            <p className="text-[10px] text-gray-600 mt-2 font-mono">MP4, MOV, AVI</p>
          </motion.label>
        </motion.div>

        {/* RIGHT: Core Visualization */}
        <div className="flex-1 h-full relative rounded-xl border border-white/5 bg-black/90 backdrop-blur-md overflow-hidden flex items-center justify-center">
          
          {/* Idle State */}
          {stage === 0 && (
            <div className="text-center">
              <div className="text-primary/20 font-mono text-sm tracking-widest uppercase mb-2 drop-shadow-none">Awaiting Video Stream</div>
              <div className="text-white/10 font-light text-xs">Ready for temporal and frame-level analysis</div>
            </div>
          )}

          {/* Processing Container */}
          {stage > 0 && mediaUrl && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-[600px] h-[450px] flex items-center justify-center"
            >
              
              {/* STAGE 1 & 2: Video Ingestion & Loading */}
              <AnimatePresence>
                {(stage === 1 || stage === 2) && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 flex flex-col items-center justify-center z-10"
                  >
                    <div className="w-full h-full rounded-lg shadow-[0_0_40px_rgba(0,245,255,0.15)] relative overflow-hidden bg-black">
                      {/* User Uploaded Video */}
                      <video 
                        src={mediaUrl} 
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay 
                        muted 
                        loop 
                      />

                      {/* Dimmer overlay for loading state */}
                      <motion.div 
                        animate={{ backgroundColor: stage === 2 ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.2)' }} 
                        className="absolute inset-0 transition-colors duration-1000" 
                      />
                      
                      {/* Play indicator (Stage 1) */}
                      <AnimatePresence>
                        {stage === 1 && (
                          <motion.div exit={{ opacity: 0 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <div className="w-0 h-0 border-t-6 border-b-6 border-l-8 border-transparent border-l-white ml-1" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Loading Overlay (Stage 2) */}
                      <AnimatePresence>
                        {stage === 2 && (
                          <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="absolute inset-0 flex flex-col items-center justify-center z-20"
                          >
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                            <div className="text-[10px] font-mono text-primary tracking-widest uppercase bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
                              Extracting frames...
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STAGE 3 & 4: Frame Grid & Analysis */}
              <AnimatePresence>
                {(stage === 3 || stage === 4) && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-3 p-2 z-20"
                  >
                    {frames.map((frame, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          filter: stage >= 3 ? 'grayscale(100%)' : 'grayscale(0%)'
                        }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        className={`relative rounded border bg-black overflow-hidden transition-all duration-300 w-full h-full ${
                          stage === 4 && activeFrameIndex === i 
                            ? 'border-primary shadow-[0_0_20px_rgba(0,245,255,0.4)] z-30 scale-[1.05] grayscale-0' 
                            : 'border-white/10 opacity-60'
                        } ${stage === 4 && frame.isSuspicious && activeFrameIndex === i ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}`}
                      >
                        <video 
                          src={mediaUrl} 
                          className="absolute inset-0 w-full h-full object-cover scale-[1.2]"
                          style={{ objectPosition: `center ${40 + (i*2)}%` }}
                          autoPlay 
                          muted 
                          loop 
                        />
                        {/* Scanning Line on Active Frame */}
                        {stage === 4 && activeFrameIndex === i && (
                          <motion.div 
                            animate={{ top: ['0%', '100%'] }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className={`absolute left-0 right-0 h-[2px] ${frame.isSuspicious ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-primary shadow-[0_0_10px_#00F5FF]'}`}
                          />
                        )}
                        
                        <div className="absolute bottom-1 left-1 bg-black/80 px-1 rounded text-[7px] font-mono text-white/80">
                          FRM_{1042 + i}
                        </div>
                      </motion.div>
                    ))}
                    
                    <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 text-[10px] font-mono text-primary tracking-widest uppercase whitespace-nowrap bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
                      {stage === 3 ? 'Grid Constructed' : 'Running frame-level inference...'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STAGE 5: Aggregation */}
              <AnimatePresence>
                {stage === 5 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 1.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, type: "spring" }}
                    className="absolute inset-0 flex flex-col items-center justify-center z-30"
                  >
                    <div className="relative w-32 h-32">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border border-dashed border-primary/40"
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 rounded-full border border-t-primary border-r-transparent border-b-primary/50 border-l-transparent"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ScanFace className="w-8 h-8 text-primary opacity-80" strokeWidth={1} />
                      </div>
                    </div>
                    <div className="mt-8 text-[10px] font-mono text-primary tracking-widest uppercase">
                      Aggregating results...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STAGE 6: Final Result Modal */}
              <AnimatePresence>
                {stage === 6 && result && result.status !== 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-md rounded-lg"
                  >
                    <div className={`p-8 rounded-xl border glass-panel w-full max-w-lg ${result.prediction === 'FAKE' ? 'border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.15)]' : 'border-primary/40 shadow-[0_0_40px_rgba(0,245,255,0.15)]'}`}>
                      
                      <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                        {result.prediction === 'FAKE' ? <AlertTriangle className="w-8 h-8 text-red-500" strokeWidth={1.5} /> : <CheckCircle className="w-8 h-8 text-primary" strokeWidth={1.5} />}
                        <div>
                          <h3 className={`text-xl font-orbitron font-bold tracking-wider ${result.prediction === 'FAKE' ? 'text-red-500' : 'text-primary'}`}>
                            {result.prediction === 'FAKE' ? 'FAKE VIDEO DETECTED' : 'AUTHENTIC VIDEO'}
                          </h3>
                          <div className="text-[10px] font-mono text-gray-400 mt-1">TEMPORAL ANALYSIS COMPLETE</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-8 mb-8">
                        {/* Confidence Ring */}
                        <div className="relative flex items-center justify-center shrink-0 w-32 h-32">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                            <motion.circle 
                              cx="64" cy="64" r="58" 
                              stroke={result.prediction === 'FAKE' ? '#ff4d4d' : '#00f5ff'} 
                              strokeWidth="8" 
                              fill="none" 
                              strokeDasharray="364"
                              initial={{ strokeDashoffset: 364 }}
                              animate={{ strokeDashoffset: 364 - (364 * result.confidence) }}
                              transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-mono font-bold text-white">{(result.confidence * 100).toFixed(2)}%</span>
                            <span className="text-[8px] text-gray-500 uppercase tracking-widest">Confidence</span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-center text-xs font-mono">
                          {result.prediction === 'FAKE' ? (
                            <>
                              <div className="text-gray-400 mb-2 border-b border-white/10 pb-1">DETECTED ANOMALIES</div>
                              <div className="text-red-400 flex items-center gap-2 mb-2"><span className="w-1 h-1 bg-red-400 rounded-full"/> Temporal inconsistencies</div>
                              <div className="text-red-400 flex items-center gap-2 mb-4"><span className="w-1 h-1 bg-red-400 rounded-full"/> Frame-level artifacts (x3)</div>
                              
                              <div className="text-gray-500 text-[9px] mb-1">FLAGGED FRAMES:</div>
                              <div className="flex gap-2">
                                {[2, 5, 7].map(f => (
                                  <div key={f} className="relative w-10 h-10 border border-red-500/50 rounded overflow-hidden">
                                    <video src={mediaUrl} className="w-full h-full object-cover grayscale" style={{ objectPosition: `center ${40 + (f*2)}%` }} />
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-gray-400 mb-2 border-b border-white/10 pb-1">ANALYSIS LOG</div>
                              <div className="text-primary flex items-center gap-2 mb-2"><span className="w-1 h-1 bg-primary rounded-full"/> Fluid temporal consistency</div>
                              <div className="text-primary flex items-center gap-2 mb-2"><span className="w-1 h-1 bg-primary rounded-full"/> Natural micro-expressions</div>
                              <div className="text-primary flex items-center gap-2"><span className="w-1 h-1 bg-primary rounded-full"/> Deepfake signatures: 0</div>
                            </>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={reset}
                        className={`w-full py-3 text-[10px] font-bold tracking-[0.2em] uppercase rounded transition-colors ${result.prediction === 'FAKE' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30' : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30'}`}
                      >
                        Analyze New Stream
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Handling */}
              <AnimatePresence>
                {result && result.status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-md rounded-lg"
                  >
                    <div className="p-8 border border-red-500/30 bg-black/40 text-center rounded-xl max-w-sm">
                      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-red-500 font-orbitron font-bold mb-4">TEMPORAL_ANALYSIS_FAILED</h3>
                      <p className="text-[10px] text-gray-400 font-mono mb-6 uppercase">{result.error || 'The system could not process this video stream'}</p>
                      <button onClick={reset} className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/30 text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all">Re-initialize Pipeline</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetection;
