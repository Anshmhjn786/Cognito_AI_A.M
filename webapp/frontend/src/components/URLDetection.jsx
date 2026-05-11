import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Shield, Activity, Search, AlertCircle, Info, CheckCircle2, XCircle, Loader2, Database, ExternalLink } from 'lucide-react';
import { API_BASE } from '../api_config';

const URLDetection = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      
      if (data.status === 'success') {
        setResult(data);
      } else {
        setError(data.message || 'Analysis failed. Please check the URL and try again.');
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setError('Connection to backend failed. Ensure the server is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPredictionColor = (prediction) => {
    switch (prediction) {
      case 'AI-GENERATED': return 'text-red-500 border-red-500/30 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]';
      case 'SUSPICIOUS': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.2)]';
      case 'REAL': return 'text-primary border-primary/30 bg-primary/10 shadow-[0_0_20px_rgba(0,245,255,0.2)]';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  const getPredictionIcon = (prediction) => {
    switch (prediction) {
      case 'AI-GENERATED': return <XCircle className="w-5 h-5" />;
      case 'SUSPICIOUS': return <AlertCircle className="w-5 h-5" />;
      case 'REAL': return <CheckCircle2 className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full h-screen bg-[#020305] text-white overflow-hidden selection:bg-primary/30">
      
      {/* Header Overlay */}
      <header className="fixed top-0 left-24 right-0 h-16 border-b border-white/5 bg-black/80 backdrop-blur-md z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link2 className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-orbitron font-bold tracking-[0.3em] uppercase">Cognito // URL_Analyzer</h1>
        </div>
        <div className="flex items-center gap-8 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-primary animate-pulse' : 'bg-gray-700'}`} />
            {isAnalyzing ? 'Processing_URL' : 'System_Ready'}
          </div>
          <span>Mode: Metadata_Forensics</span>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto pt-32 px-8 flex flex-col gap-8 h-[calc(100vh-100px)]">
        
        {/* Input Section */}
        <section className="w-full max-w-4xl mx-auto">
          <form onSubmit={handleAnalyze} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative flex items-center bg-black/40 border border-white/10 rounded-2xl p-2 backdrop-blur-sm">
              <div className="pl-6 pr-4">
                <Search className="w-5 h-5 text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder="Enter YouTube, Instagram, or direct media URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm font-mono tracking-tight py-4 text-white placeholder:text-gray-600"
              />
              <button 
                type="submit"
                disabled={isAnalyzing || !url}
                className="px-8 py-4 bg-primary/10 border border-primary/30 text-primary rounded-xl font-orbitron text-[10px] tracking-[0.2em] uppercase hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                {isAnalyzing ? 'Analyzing' : 'Run_Analysis'}
              </button>
            </div>
          </form>
          
          <div className="mt-4 flex justify-center gap-6 text-[8px] font-mono text-gray-600 uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1.5"><ExternalLink size={10} /> YouTube</span>
            <span className="flex items-center gap-1.5"><ExternalLink size={10} /> Instagram</span>
            <span className="flex items-center gap-1.5"><ExternalLink size={10} /> Direct Link</span>
          </div>
        </section>

        <section className="flex-1 overflow-y-auto no-scrollbar pb-12">
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary/5 blur-xl"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-orbitron text-primary tracking-[0.3em] uppercase mb-2">Analyzing Metadata</h3>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest animate-pulse">Extracting forensic markers...</p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl mx-auto p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-orbitron text-red-500 tracking-widest uppercase mb-1">Analysis_Error</h4>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {/* Result Summary */}
                <div className="md:col-span-2 space-y-8">
                  <div className={`p-8 rounded-3xl border ${getPredictionColor(result.prediction)} flex flex-col gap-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPredictionIcon(result.prediction)}
                        <span className="font-orbitron font-bold text-sm tracking-[0.4em] uppercase">{result.prediction}</span>
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                        Platform: {result.platform}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] mb-3 opacity-50">Forensic_Explanation</h4>
                      <p className="text-sm font-medium leading-relaxed tracking-wide">
                        {result.explanation}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                      <div className="space-y-1">
                        <div className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Metadata_Found</div>
                        <div className="text-xs font-bold font-mono">{result.metadata_detected ? 'TRUE' : 'FALSE'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Heuristic_Confidence</div>
                        <div className="text-xs font-bold font-mono">{(result.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Table */}
                  {result.metadata_detected && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                      <div className="flex items-center gap-3 mb-8">
                        <Database className="w-4 h-4 text-gray-500" />
                        <h4 className="text-[10px] font-orbitron text-gray-400 tracking-[0.3em] uppercase">Raw_Metadata_Log</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {Object.entries(result.metadata).map(([key, value]) => (
                          <div key={key} className="flex flex-col gap-1 border-b border-white/[0.03] pb-2">
                            <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">{key}</span>
                            <span className="text-[10px] font-mono text-white/80 truncate" title={String(value)}>
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-[10px] font-mono text-primary/70 uppercase tracking-widest mb-4">How_it_works</h3>
                    <ul className="space-y-4 text-[10px] font-mono text-gray-500 leading-relaxed">
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                        <span>Analyzes EXIF tags for camera and software markers.</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                        <span>Checks video streams for specific encoder signatures (FFmpeg, Lavf).</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                        <span>Cross-references metadata with known AI-generation strings.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">Security_Notice</h3>
                    <p className="text-[9px] font-mono text-gray-600 leading-relaxed uppercase tracking-widest">
                      Media is downloaded temporarily for analysis and purged immediately after extraction. No permanent storage of user content is maintained.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {!isAnalyzing && !result && !error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-4xl mx-auto py-20 text-center opacity-20"
              >
                <div className="w-20 h-20 mx-auto mb-8 border border-white/5 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-orbitron tracking-[0.5em] uppercase mb-4">Awaiting_Input</h3>
                <p className="text-[10px] font-mono uppercase tracking-widest">Enter a media URL to begin forensic investigation</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

export default URLDetection;
