import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Eye, Activity, Map } from 'lucide-react';
import { API_BASE } from '../api_config';

const ImageDetection = () => {
  const [stage, setStage] = useState(0); // 0: Idle, 1-6: Processing, 7: Result
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState('original'); // 'original', 'heatmap', 'gradcam'

  // Simulated Facial Landmarks (Centered percentages)
  const landmarks = [
    { x: 38, y: 38, id: 'eye_l' }, { x: 62, y: 38, id: 'eye_r' }, // Eyes
    { x: 50, y: 50, id: 'nose_tip' }, { x: 50, y: 40, id: 'nose_bridge' }, // Nose
    { x: 42, y: 68, id: 'lip_l' }, { x: 58, y: 68, id: 'lip_r' }, { x: 50, y: 65, id: 'lip_t' }, { x: 50, y: 72, id: 'lip_b' }, // Lips
    { x: 30, y: 45, id: 'jaw_1' }, { x: 35, y: 70, id: 'jaw_2' }, { x: 50, y: 82, id: 'jaw_3' }, { x: 65, y: 70, id: 'jaw_4' }, { x: 70, y: 45, id: 'jaw_5' }, // Jaw
    { x: 40, y: 22, id: 'fh_1' }, { x: 60, y: 22, id: 'fh_2' }, { x: 50, y: 18, id: 'fh_3' } // Forehead
  ];

  // Triangle Indices for Mesh
  const meshTriangles = [
    [13, 15, 14], [13, 0, 3], [14, 1, 3], [0, 3, 2], [1, 3, 2],
    [8, 0, 4], [12, 1, 5], [0, 2, 4], [1, 2, 5], [4, 6, 2], [5, 6, 2],
    [4, 6, 7], [5, 6, 7], [8, 9, 4], [12, 11, 5], [9, 10, 7], [11, 10, 7],
    [9, 4, 7], [11, 5, 7]
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setResult(null);
      setViewMode('original');
      startAnalysis(file);
    }
  };

  const startAnalysis = async (file) => {
    setLoading(true);
    setStage(1);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/predict-image`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      console.log("Prediction Result:", data); // Debug Log
      setResult(data);
      setViewMode('result'); // Set to result view once data arrives
    } catch (error) {
      console.error("API Error:", error);
      setResult({ status: 'error', error: 'Processing failed' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stage > 0 && stage < 7) {
      // Stage mapping: 1:Original, 2:Grayscale, 3:Landmarks, 4:Mesh, 5:Scan, 6:Heatmap, 7:Result
      const delays = [0, 800, 800, 800, 1000, 1000, 1000];

      // If result is ready and we are at stage 6, move to 7
      if (result && stage === 6) {
        setStage(7);
        return;
      }

      const timer = setTimeout(() => {
        setStage(prev => prev + 1);
      }, delays[stage]);
      return () => clearTimeout(timer);
    }
  }, [stage, result]);

  const reset = () => {
    setStage(0);
    setMediaUrl(null);
    setResult(null);
  };

  return (
    <div className="flex w-full h-full text-white font-inter relative z-10 p-6 pr-12 gap-8">
      {/* LEFT: Upload Panel */}
      <motion.div
        animate={{ width: stage > 0 ? '15%' : '25%' }}
        className="flex flex-col h-full border border-primary/10 bg-black/80 backdrop-blur-3xl p-6 relative overflow-hidden transition-all duration-700"
      >
        <div className="text-[10px] text-primary/70 font-mono tracking-widest uppercase mb-8">Input Media</div>
        <motion.label
          whileHover={{ scale: 1.02, boxShadow: '0 0 10px rgba(0,245,255,0.05)' }}
          className="flex-1 border border-dashed border-primary/20 rounded-lg flex flex-col items-center justify-center cursor-pointer group hover:border-primary/40 transition-colors bg-black/40"
        >
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <Upload className="w-8 h-8 text-gray-500 mb-4 group-hover:text-primary transition-colors" />
          <p className="text-sm text-gray-400 group-hover:text-white">Select Image</p>
        </motion.label>
      </motion.div>

      {/* RIGHT: Analysis Area */}
      <div className="flex-1 h-full relative rounded-xl border border-white/5 bg-black/95 backdrop-blur-md overflow-hidden flex items-center justify-center">
        {stage === 0 && (
          <div className="text-center opacity-30">
            <div className="text-primary font-mono text-xs tracking-widest uppercase mb-2">System Ready</div>
            <div className="text-white font-light text-[10px]">Awaiting source for structural mapping</div>
          </div>
        )}

        {stage > 0 && mediaUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-[500px] h-[500px]">
            {/* Base Image Container */}
            <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/10">
              {/* STAGE 1: Original Image Base */}
              <div
                className="absolute inset-0 bg-contain bg-no-repeat bg-center"
                style={{ backgroundImage: `url(${mediaUrl})` }}
              />

              {/* STAGE 2: Grayscale Sweep (Left to Right) */}
              <motion.div
                initial={{ clipPath: 'inset(0 100% 0 0)' }}
                animate={{ clipPath: stage >= 2 ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-contain bg-no-repeat bg-center grayscale z-10"
                style={{ backgroundImage: `url(${mediaUrl})` }}
              />

              {/* STAGE 6: Heatmap Simulation (Smooth Build-up) - ONLY during loading */}
              <AnimatePresence>
                {stage >= 6 && stage < 7 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.65 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 z-20 mix-blend-color-burn pointer-events-none"
                  >
                    {/* Simulated Heatmap regions */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 2, delay: 0.2 }}
                      className="absolute top-[35%] left-[35%] w-32 h-32 bg-red-600 blur-[45px] rounded-full"
                    />
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 2.5, delay: 0.5 }}
                      className="absolute bottom-[25%] right-[30%] w-44 h-44 bg-orange-600 blur-[55px] rounded-full"
                    />
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 3, delay: 0.8 }}
                      className="absolute top-[50%] left-[50%] w-24 h-24 bg-cyan-600 blur-[35px] rounded-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* VIEW: Original / Heatmap / GradCAM */}
              <AnimatePresence mode="wait">
                {stage === 7 && result && result.status !== 'error' && (
                  <motion.div 
                    key={viewMode}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full z-25 flex items-center justify-center bg-black/20"
                  >
                    {viewMode === 'original' && (
                      <div
                        className="w-full h-full bg-contain bg-no-repeat bg-center"
                        style={{ backgroundImage: `url(${mediaUrl})` }}
                      />
                    )}
                    {viewMode === 'heatmap' && result.heatmap && (
                      <img
                        src={result.heatmap}
                        alt="Heatmap"
                        className="w-full h-full object-contain mix-blend-overlay"
                      />
                    )}
                    {viewMode === 'gradcam' && result.gradcam && (
                      <img
                        src={result.gradcam}
                        alt="GradCAM"
                        className="w-full h-full object-contain mix-blend-screen"
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SVG Overlay for Mesh + Landmarks (Correct Layering - TOP) */}
              <svg className="absolute inset-0 w-full h-full z-30 pointer-events-none overflow-visible">
                {/* STAGE 4: Face Mesh Formation (Progressive Drawing) - ONLY during loading */}
                <AnimatePresence>
                  {stage >= 4 && stage < 7 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {meshTriangles.map((tri, i) => (
                        <motion.path
                          key={`tri-${i}`}
                          d={`M ${landmarks[tri[0]].x}% ${landmarks[tri[0]].y}% L ${landmarks[tri[1]].x}% ${landmarks[tri[1]].y}% L ${landmarks[tri[2]].x}% ${landmarks[tri[2]].y}% Z`}
                          fill="none"
                          stroke={stage === 5 ? "#00F5FF" : "rgba(0, 245, 255, 0.15)"}
                          strokeWidth="0.5"
                          initial={{ pathLength: 0 }}
                          animate={{
                            pathLength: 1,
                            strokeOpacity: stage === 5 ? [0.15, 0.7, 0.15] : 0.15
                          }}
                          transition={{
                            pathLength: { duration: 1.5, delay: i * 0.04 },
                            strokeOpacity: { duration: 2, repeat: Infinity }
                          }}
                        />
                      ))}
                    </motion.g>
                  )}
                </AnimatePresence>

                {/* STAGE 3: Landmark Detection (Progressive Dots) - ONLY during loading */}
                <AnimatePresence>
                  {stage >= 3 && stage < 7 && (
                    <g>
                      {landmarks.map((pt, i) => (
                        <motion.circle
                          key={`pt-${i}`}
                          cx={`${pt.x}%`}
                          cy={`${pt.y}%`}
                          r="1.2"
                          fill="#00F5FF"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: stage === 5 ? [0.4, 1, 0.4] : 0.7,
                            scale: 1
                          }}
                          transition={{ delay: i * 0.05 }}
                          className="shadow-[0_0_5px_#00F5FF]"
                        />
                      ))}
                    </g>
                  )}
                </AnimatePresence>

                {/* STAGE 5: Scanning Line Upgrade */}
                <AnimatePresence>
                  {stage === 5 && (
                    <motion.g>
                      <motion.line
                        initial={{ y1: '0%', y2: '0%' }}
                        animate={{ y1: '100%', y2: '100%' }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        x1="0%" x2="100%"
                        stroke="#00F5FF"
                        strokeWidth="1.5"
                        strokeOpacity="0.8"
                        className="shadow-[0_0_12px_#00F5FF]"
                      />
                    </motion.g>
                  )}
                </AnimatePresence>
              </svg>

              {/* Scanning Glow Background Pass */}
              <AnimatePresence>
                {stage === 5 && (
                  <motion.div
                    initial={{ top: '-10%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-16 bg-primary/5 blur-lg z-10 pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* ForensicHUD Labels */}
            <div className="absolute -bottom-8 left-0 right-0 flex justify-between items-center font-mono text-[7px] tracking-[0.4em] uppercase text-primary/30">
              <div className="flex items-center gap-6">
                <AnimatePresence mode="wait">
                  {stage === 2 && <motion.span key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Extracting Grayscale Luminance...</motion.span>}
                  {stage === 3 && <motion.span key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Registering Facial Keypoints...</motion.span>}
                  {stage === 4 && <motion.span key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Mapping Structural Topology...</motion.span>}
                  {stage === 5 && <motion.span key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Surface Consistency Scan...</motion.span>}
                  {stage === 6 && <motion.span key="s6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Generating Probability Maps...</motion.span>}
                  {stage === 7 && result && result.status !== 'error' && (
                    <motion.div 
                      key="s7"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex gap-1 bg-white/5 border border-white/10 rounded px-1 py-0.5"
                    >
                      <button
                        onClick={() => setViewMode('result')}
                        className={`px-2 py-0.5 rounded text-[6px] font-bold transition-all ${viewMode === 'result' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
                      >
                        REPORT
                      </button>
                      <button
                        onClick={() => setViewMode('original')}
                        className={`px-2 py-0.5 rounded text-[6px] font-bold transition-all ${viewMode === 'original' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
                      >
                        MEDIA
                      </button>
                      {result.heatmap && (
                        <button
                          onClick={() => setViewMode('heatmap')}
                          className={`px-2 py-0.5 rounded text-[6px] font-bold transition-all ${viewMode === 'heatmap' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                          HEATMAP
                        </button>
                      )}
                      {result.gradcam && (
                        <button
                          onClick={() => setViewMode('gradcam')}
                          className={`px-2 py-0.5 rounded text-[6px] font-bold transition-all ${viewMode === 'gradcam' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                          GRADCAM
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-col items-end opacity-40">
                <span>SYS_PROCESS // CORE_LINK_04</span>
                <span className="mt-0.5">FORENSIC_HUD_V2.1</span>
              </div>
            </div>

            {/* VIEW: Result Card Overlay */}
            <AnimatePresence>
              {stage === 7 && result && result.status !== 'error' && viewMode === 'result' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm pointer-events-none"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className={`p-8 rounded-2xl border bg-black/90 backdrop-blur-2xl max-w-md w-full pointer-events-auto ${result.prediction === 'FAKE' ? 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'border-primary/50 shadow-[0_0_50px_rgba(0,245,255,0.2)]'}`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                      <div>
                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-1">Inference Report</div>
                        <h3 className={`text-2xl font-orbitron font-bold tracking-widest ${result.prediction === 'FAKE' ? 'text-red-500' : 'text-primary'}`}>
                          {result.prediction === 'FAKE' ? 'SYNTHETIC_DETECTED' : 'AUTHENTIC_SOURCE'}
                        </h3>
                      </div>
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold ${result.prediction === 'FAKE' ? 'border-red-500/30 text-red-500 shadow-[0_0_10px_#ef4444]' : 'border-primary/30 text-primary shadow-[0_0_10px_#00f5ff]'}`}>
                        {result.prediction === 'FAKE' ? '!' : '✓'}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 items-center mb-8">
                      <div className="relative flex items-center justify-center">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                          <motion.circle
                            cx="48" cy="48" r="42" stroke={result.prediction === 'FAKE' ? '#ff4d4d' : '#00f5ff'}
                            strokeWidth="6" fill="none" strokeDasharray="264"
                            initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * result.confidence) }}
                            transition={{ duration: 2, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-xl font-mono font-bold text-white">{(result.confidence * 100).toFixed(2)}%</span>
                          <span className="text-[8px] text-gray-500 uppercase">Confidence</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-[9px] font-mono text-left flex-1">
                        <div className="text-gray-500 uppercase tracking-widest border-b border-white/5 pb-1">Model Telemetry</div>
                        {result.prediction === 'FAKE' ? (
                          <>
                            <div className="text-red-400 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>
                              Frequency Artifacts Detect
                            </div>
                            <div className="text-red-400 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>
                              Gradient Distribution Error
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-primary/70 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full"/>
                              Structural Integrity OK
                            </div>
                            <div className="text-primary/70 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full"/>
                              Source Authentication Valid
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={reset} 
                      className={`w-full py-3 rounded-lg font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${result.prediction === 'FAKE' ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'}`}
                    >
                      Process New Media
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Handling */}
            <AnimatePresence>
              {result && result.status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md rounded-lg"
                >
                  <div className="p-8 border border-red-500/30 bg-black/40 text-center rounded-xl max-w-xs">
                    <h3 className="text-red-500 font-orbitron font-bold mb-4">PROCESSING_FAILED</h3>
                    <p className="text-[10px] text-gray-400 font-mono mb-6 uppercase">{result.error || 'The system encountered an unexpected error'}</p>
                    <button onClick={reset} className="w-full py-2 bg-red-500/10 text-red-500 border border-red-500/30 text-[9px] font-bold uppercase hover:bg-red-500/20 transition-all">Restart System</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ImageDetection;
