import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Shield, Activity, RefreshCw, AlertCircle, History, CameraOff } from 'lucide-react';
import { API_BASE } from '../api_config';

const RealtimeDetection = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [buffer, setBuffer] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, fake: 0 });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const captureIntervalRef = useRef(null);

  // Setup Webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Please allow camera access for realtime analysis.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }
    setIsCapturing(false);
    setBuffer([]);
    setIsAnalyzing(false);
  };

  // Capture Loop
  useEffect(() => {
    if (isCapturing) {
      captureIntervalRef.current = setInterval(captureFrame, 400); // Sample every 400ms (~6.4 seconds for 16 frames)
    } else {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    }
    return () => clearInterval(captureIntervalRef.current);
  }, [isCapturing]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8);
    
    setBuffer(prev => {
      const newBuffer = [...prev, frameData];
      if (newBuffer.length >= 16) {
        // Send to analysis
        analyzeBatch(newBuffer);
        return []; // Clear for next batch
      }
      return newBuffer;
    });
  };

  const analyzeBatch = async (frames) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE}/predict-realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setLastResult(data);
        setHistory(prev => [data, ...prev].slice(0, 5));
        setStats(prev => ({
          total: prev.total + 1,
          fake: prev.fake + (data.prediction === 'FAKE' ? 1 : 0)
        }));
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#020305] text-white overflow-hidden selection:bg-primary/30">
      
      {/* Header Overlay */}
      <header className="fixed top-0 left-24 right-0 h-16 border-b border-white/5 bg-black/80 backdrop-blur-md z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-orbitron font-bold tracking-[0.3em] uppercase">Cognito // Realtime_Lab</h1>
        </div>
        <div className="flex items-center gap-8 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isCapturing ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`} />
            {isCapturing ? 'Stream_Active' : 'Stream_Standby'}
          </div>
          <span>Uptime: 00:14:02</span>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto pt-24 px-8 flex gap-8 h-[calc(100vh-100px)]">
        
        {/* LEFT PANEL: CONTROLS (20%) */}
        <div className="w-1/5 flex flex-col gap-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col">
            <h3 className="text-[10px] font-mono text-primary/70 uppercase tracking-widest mb-6">Stream_Control</h3>
            
            <button
              onClick={isCapturing ? stopCamera : startCamera}
              className={`w-full py-4 rounded-xl font-orbitron text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 ${
                isCapturing 
                ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20' 
                : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20'
              }`}
            >
              {isCapturing ? <CameraOff size={14} /> : <Camera size={14} />}
              {isCapturing ? 'Terminate_Stream' : 'Initialize_Camera'}
            </button>

            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center px-4 py-3 bg-black/40 rounded-lg border border-white/5">
                <span className="text-[8px] font-mono text-gray-500 uppercase">Status</span>
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                  {isAnalyzing ? 'Analyzing' : isCapturing ? 'Capturing' : 'Idle'}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-black/40 rounded-lg border border-white/5">
                <span className="text-[8px] font-mono text-gray-500 uppercase">Buffer_State</span>
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                  {buffer.length} / 16
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">Session_Stats</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[10px] font-mono mb-2">
                  <span className="text-gray-500 uppercase">Batches_Processed</span>
                  <span className="text-white">{stats.total}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, stats.total * 5)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono mb-2">
                  <span className="text-gray-500 uppercase">Fake_Ratio</span>
                  <span className="text-red-400">{stats.total > 0 ? ((stats.fake / stats.total) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500/60" style={{ width: `${stats.total > 0 ? (stats.fake / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: WEB CAM (60%) */}
        <div className="w-3/5 flex flex-col gap-6 relative">
          <div className="flex-1 border border-white/5 bg-black rounded-2xl relative overflow-hidden flex items-center justify-center group shadow-2xl">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-opacity duration-1000 ${isCapturing ? 'opacity-70' : 'opacity-10'}`}
            />
            
            {/* Minimal Overlay UI */}
            {isCapturing && (
              <>
                <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20" />
                <div className="absolute inset-0 pointer-events-none">
                  {/* Scan Line */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[1px] bg-primary/30 shadow-[0_0_15px_#00F5FF]"
                  />
                </div>

                {/* Live Verdict Tag */}
                <AnimatePresence>
                  {lastResult && (
                    <motion.div
                      key={lastResult.timestamp}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`absolute top-8 left-1/2 -translate-x-1/2 px-8 py-3 rounded-sm backdrop-blur-xl border font-orbitron font-bold text-xs tracking-[0.4em] uppercase z-10 ${
                        lastResult.prediction === 'FAKE' 
                        ? 'bg-red-500/20 border-red-500/40 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                        : 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_30px_rgba(0,245,255,0.2)]'
                      }`}
                    >
                      {lastResult.prediction} // CONFID_{ (lastResult.confidence * 100).toFixed(0) }%
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {!isCapturing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
                  <CameraOff className="w-8 h-8 text-white/10" />
                </div>
                <h2 className="text-xl font-orbitron text-white/20 tracking-[0.3em] uppercase">Sensor_Offline</h2>
              </div>
            )}

            <canvas ref={canvasRef} width="224" height="224" className="hidden" />
          </div>
        </div>

        {/* RIGHT PANEL: HISTORY (20%) */}
        <div className="w-1/5 flex flex-col gap-6">
          <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 overflow-y-auto no-scrollbar">
            <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <History size={12} /> Temporal_History
            </h3>
            
            <div className="space-y-4">
              <AnimatePresence>
                {history.map((res, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${res.prediction === 'FAKE' ? 'text-red-500' : 'text-primary'}`}>
                        {res.prediction}
                      </div>
                      <div className="text-[8px] font-mono text-gray-700">{(res.confidence * 100).toFixed(1)}% Confidence</div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center">
                      <Activity size={12} className={res.prediction === 'FAKE' ? 'text-red-500' : 'text-primary'} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {history.length === 0 && (
                <div className="py-20 text-center opacity-10">
                  <Activity className="w-10 h-10 mx-auto mb-4" />
                  <span className="text-[8px] font-mono uppercase tracking-widest">No Buffer Logs</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default RealtimeDetection;
