import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Film, Database, Search } from 'lucide-react';
import { API_BASE } from '../api_config';

// Sub-components
import VideoUploader from './video-detection/VideoUploader';
import Timeline from './video-detection/Timeline';
import VideoResultPanel from './video-detection/VideoResultPanel';
import VideoHistorySection from './video-detection/VideoHistorySection';
import ReportModal from './image-detection/ReportModal'; // Reusing Image Report Modal as it's generic enough

const VideoDetection = () => {
  const serverBase = API_BASE.replace('/api', '');

  const resolveMediaUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    return `${serverBase}${path}`;
  };

  // Phase Management
  const [phase, setPhase] = useState("idle"); // idle, processing, result
  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [frames, setFrames] = useState([]);
  const [flaggedFrames, setFlaggedFrames] = useState([]);

  // History State
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('forensic_video_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const historyRef = useRef(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('forensic_video_history', JSON.stringify(history));
  }, [history]);

  // Review Cycle Logic (Processing Phase)
  useEffect(() => {
    let interval;
    if (phase === "processing" && frames.length > 0) {
      interval = setInterval(() => {
        setActiveIndex(prev => {
          if (prev >= frames.length - 1) {
            clearInterval(interval);
            setTimeout(() => setPhase("result"), 800); // Brief pause at the end
            return prev;
          }
          return prev + 1;
        });
      }, 150); // Speed of the review cycle
    }
    return () => clearInterval(interval);
  }, [phase, frames]);

  const handleUpload = async (file) => {
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setPhase("processing");
    setResult(null);
    setFrames([]);
    setFlaggedFrames([]);
    setActiveIndex(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/predict-video`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setFrames(data.frames || []);
        setFlaggedFrames(data.flagged_frames || []);
        setResult(data);

        // Add to history once the review cycle finishes (triggered in useEffect)
        // But we prepare the item here
      } else {
        setPhase("idle");
        alert("Analysis failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("API Error:", err);
      setPhase("idle");
    }
  };

  // Finalize history and scroll
  useEffect(() => {
    if (phase === "result" && result && !history.find(h => h.id === result.id)) {
      const historyItem = {
        ...result,
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 12));

      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1000);
    }
  }, [phase, result]);

  const reset = () => {
    setPhase("idle");
    setMediaUrl(null);
    setResult(null);
    setFrames([]);
    setFlaggedFrames([]);
    setActiveIndex(0);
  };

  return (
    <div className="w-full h-screen overflow-y-auto scroll-smooth bg-[#020305] text-white selection:bg-primary/30">
      
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-black/80 backdrop-blur-md z-50 px-8 flex items-center justify-between">
        <div className="ml-24 flex items-center gap-3 px-4 py-4">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-orbitron font-bold tracking-[0.3em] uppercase">Cognito // Temporal_Lab</h1>
        </div>
        <div className="flex items-center gap-8 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Neural_Buffer_Active
          </div>
          <span>Uptime: 142:11:05</span>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto pt-24 px-8 pb-32">
        
        {/* 3-COLUMN LAYOUT */}
        <div className="flex gap-8 min-h-[600px] mb-24">
          
          {/* LEFT: UPLOAD (20%) */}
          <div className="w-1/5 flex flex-col gap-6">
            <div className="flex-1 border border-white/5 bg-white/[0.02] rounded-2xl p-6 flex flex-col">
              <h3 className="text-[10px] font-mono text-primary/70 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Search className="w-3 h-3" /> Input_Stream
              </h3>
              <div className="flex-1 flex flex-col justify-center">
                <VideoUploader onUpload={handleUpload} isProcessing={phase === "processing"} />
              </div>
              <div className="mt-6 p-4 bg-black/40 rounded-lg border border-white/5">
                <p className="text-[9px] font-mono text-gray-500 leading-relaxed italic">
                  Drop temporal evidence for sequential frame-buffer analysis.
                </p>
              </div>
            </div>
          </div>

          {/* CENTER: VIEWER + TIMELINE (60%) */}
          <div className="w-3/5 flex flex-col gap-6">
            {/* Viewer */}
            <div className="flex-1 border border-white/5 bg-white/[0.01] rounded-2xl relative overflow-hidden flex items-center justify-center p-8 group shadow-inner min-h-[400px]">
              <AnimatePresence mode="wait">
                {phase === "idle" && (
                  <motion.div 
                    key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-center opacity-20"
                  >
                    <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center mx-auto mb-6">
                      <Film className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-orbitron tracking-widest uppercase">Awaiting Temporal Sequence</h2>
                  </motion.div>
                )}

                {(phase === "processing" || phase === "result") && (
                  <motion.div 
                    key="active" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full relative"
                  >
                    {frames.length > 0 ? (
                      <div className="w-full h-full flex flex-col items-center justify-center relative">
                        <motion.img 
                          key={activeIndex}
                          initial={{ opacity: 0.8 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          src={resolveMediaUrl(frames[activeIndex])} 
                          alt="Processing Frame" 
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10"
                          onError={(e) => {
                            e.target.style.opacity = 0.2;
                            e.target.alt = "Frame failed to load";
                          }}
                        />
                        {flaggedFrames.includes(activeIndex) && (
                          <div className="absolute top-4 right-4 px-4 py-2 bg-red-500/20 backdrop-blur-md border border-red-500/40 rounded text-[10px] font-orbitron text-red-500 tracking-widest uppercase">
                            Anomaly Detected
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-primary/40">
                        <Activity className="w-12 h-12 animate-pulse" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Initializing Frame Extraction...</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Timeline */}
            <AnimatePresence>
              {(phase === "processing" || phase === "result") && frames.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <Timeline 
                    frames={frames} 
                    flaggedFrames={flaggedFrames} 
                    activeIndex={activeIndex}
                    onFrameClick={(index) => {
                      if (phase === "result") setActiveIndex(index);
                    }}
                    isProcessing={phase === "processing"}
                    apiBase={serverBase}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: RESULTS (20%) */}
          <div className="w-1/5 flex flex-col">
            <AnimatePresence mode="wait">
              {phase === "result" && result ? (
                <VideoResultPanel result={result} onReset={reset} />
              ) : (
                <motion.div 
                  key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 border border-white/5 bg-white/[0.02] rounded-2xl p-8 flex flex-col items-center justify-center text-center text-gray-700"
                >
                  <Database className="w-10 h-10 opacity-10 mb-4" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em]">Analysis Standby</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* HISTORY SECTION */}
        <div ref={historyRef} className="pt-12 border-t border-white/5">
          <VideoHistorySection 
            history={history} 
            onCardClick={(item) => {
              setFrames(item.frames || []);
              setFlaggedFrames(item.flagged_frames || []);
              setResult(item);
              setPhase("result");
              setActiveIndex(0);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            apiBase={serverBase}
          />
        </div>

      </main>

      {/* DETAILED MODAL (Optional) */}
      <AnimatePresence>
        {selectedHistoryItem && (
          <ReportModal 
            item={selectedHistoryItem} 
            onClose={() => setSelectedHistoryItem(null)} 
            apiBase={API_BASE.replace('/api', '')}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default VideoDetection;
