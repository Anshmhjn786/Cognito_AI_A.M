import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Search, Database } from 'lucide-react';
import { API_BASE } from '../api_config';

// Sub-components
import ImageUploader from './image-detection/ImageUploader';
import ScanViewer from './image-detection/ScanViewer';
import ResultOverlay from './image-detection/ResultOverlay';
import HistorySection from './image-detection/HistorySection';
import ReportModal from './image-detection/ReportModal';

const ImageDetection = () => {
  // 1. STATE MACHINE (idle | scanning | result)
  const [phase, setPhase] = useState("idle");
  const [mediaUrl, setMediaUrl] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [tempResult, setTempResult] = useState(null);
  const [result, setResult] = useState(null);
  
  // History State
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('forensic_v4_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const historyRef = useRef(null);
  const serverBase = API_BASE.replace('/api', '');

  // Debug (Temp)
  useEffect(() => {
    console.log("PHASE:", phase);
    console.log("TEMP:", tempResult);
    console.log("RESULT:", result);
  }, [phase, tempResult, result]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('forensic_v4_history', JSON.stringify(history));
  }, [history]);

  // 2. SCAN ANIMATION LOGIC (CRITICAL FIX)
  useEffect(() => {
    if (phase !== "scanning") return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setScanProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        
        // Ensure result is only set if we have tempResult
        // If API is slow, we wait until tempResult is available
      }
    }, 30);

    return () => clearInterval(interval);
  }, [phase]);

  // Watch for scan completion AND tempResult readiness
  useEffect(() => {
    if (phase === "scanning" && scanProgress >= 100 && tempResult) {
      setResult(tempResult);
      setPhase("result");

      // Push to History
      const newItem = {
        ...tempResult,
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        displayImage: tempResult.saved_image_path ? `${serverBase}${tempResult.saved_image_path}` : mediaUrl
      };
      setHistory(prev => [newItem, ...prev].slice(0, 10));

      // Auto-scroll to history
      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1000);
    }
  }, [scanProgress, tempResult, phase]);

  // 3. API CALL (ON UPLOAD)
  const handleUpload = async (file) => {
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setPhase("scanning");
    setScanProgress(0);
    setResult(null);
    setTempResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/predict-image`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setTempResult(data);
    } catch (err) {
      console.error("API Error:", err);
      setTempResult({ status: 'error', message: 'Connection Failure' });
    }
  };

  const reset = () => {
    setPhase("idle");
    setMediaUrl(null);
    setResult(null);
    setTempResult(null);
    setScanProgress(0);
  };

  return (
    <div className="w-full h-screen overflow-y-auto scroll-smooth bg-[#020305] text-white">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-black/80 backdrop-blur-md z-50 px-8 flex items-center justify-between">
        <div className="ml-24 flex items-center gap-3 px-4 py-4">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-orbitron font-bold tracking-[0.3em]">COGNITO // FORENSIC_LAB</h1>
        </div>
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          SYSTEM_STATUS: ONLINE
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto pt-24 px-8 pb-32">
        
        {/* 3-ZONE SYSTEM */}
        <div className="flex gap-8 h-[600px] mb-24">
          
          {/* LEFT: UPLOAD */}
          <div className="w-1/5">
            <div className="h-full border border-white/5 bg-white/[0.02] rounded-2xl p-6 flex flex-col">
              <h3 className="text-[10px] font-mono text-primary/70 uppercase tracking-widest mb-6">Source_Input</h3>
              <div className="flex-1 flex flex-col justify-center">
                <ImageUploader onUpload={handleUpload} isIdle={phase === "idle"} />
              </div>
              <div className="mt-6 text-center">
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                  {phase === "idle" ? "Drop Image to Begin Forensic Scan" : "Scanning Stream..."}
                </p>
              </div>
            </div>
          </div>

          {/* CENTER: VIEWER */}
          <div className="w-3/5 flex flex-col">
            <div className="flex-1 border border-white/5 bg-white/[0.01] rounded-2xl relative overflow-hidden flex items-center justify-center p-8">
              <AnimatePresence mode="wait">
                {phase === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center opacity-20">
                    <Database className="w-12 h-12 mx-auto mb-4" />
                    <h2 className="text-sm font-orbitron tracking-widest uppercase">Waiting for Evidence</h2>
                  </motion.div>
                )}

                {(phase === "scanning" || phase === "result") && (
                  <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full">
                    <ScanViewer 
                      mediaUrl={mediaUrl} 
                      scanProgress={scanProgress}
                      isResult={phase === "result"}
                      resultImage={phase === "result" && result?.heatmap ? `${serverBase}${result.heatmap}` : null}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: RESULT */}
          <div className="w-1/5">
            <AnimatePresence mode="wait">
              {phase === "result" && result ? (
                <ResultOverlay key="result" result={result} onReset={reset} />
              ) : (
                <motion.div 
                  key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full border border-white/5 bg-white/[0.02] rounded-2xl flex flex-col items-center justify-center text-center p-8"
                >
                  <Activity className="w-10 h-10 opacity-10 mb-4" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-gray-700">Analysis Standby</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* BOTTOM: HISTORY */}
        <div ref={historyRef} className="pt-12 border-t border-white/5">
          <HistorySection 
            history={history} 
            onCardClick={setSelectedHistoryItem} 
            apiBase={serverBase} 
          />
        </div>

      </main>

      {/* MODAL */}
      <AnimatePresence>
        {selectedHistoryItem && (
          <ReportModal 
            item={selectedHistoryItem} 
            onClose={() => setSelectedHistoryItem(null)} 
            apiBase={serverBase}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default ImageDetection;
