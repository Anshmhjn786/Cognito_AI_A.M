import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Cpu, Database, GitBranch, ShieldCheck, AlertCircle } from 'lucide-react';

const InsightCard = ({ icon: Icon, title, content, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-primary/20 transition-all group"
  >
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="text-xs font-orbitron font-bold tracking-[0.2em] uppercase text-white/90">{title}</h3>
    </div>
    <div className="space-y-4">
      {content.map((text, i) => (
        <p key={i} className="text-[11px] font-mono leading-relaxed text-gray-500 uppercase tracking-tighter">
          {text}
        </p>
      ))}
    </div>
  </motion.div>
);

const PipelineStep = ({ label, sublabel }) => (
  <div className="flex flex-col items-center gap-2 group">
    <div className="w-32 h-16 border border-white/10 bg-white/[0.02] rounded-lg flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
      <span className="text-[9px] font-bold text-primary/80 tracking-widest uppercase">{label}</span>
    </div>
    <span className="text-[7px] font-mono text-gray-700 uppercase tracking-widest">{sublabel}</span>
  </div>
);

const ResearchPage = () => {
  return (
    <div className="w-full h-screen overflow-y-auto scroll-smooth bg-[#020305] text-white selection:bg-primary/30">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-black/80 backdrop-blur-md z-50 px-8 flex items-center justify-between ml-24">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-orbitron font-bold tracking-[0.3em] uppercase">Cognito // Research_Insights</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto pt-32 px-8 pb-32">
        
        {/* Intro */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="mb-20 text-center"
        >
          <span className="text-[10px] font-mono text-primary tracking-[0.5em] uppercase mb-4 block">Scientific Documentation</span>
          <h2 className="text-4xl font-orbitron font-bold tracking-tighter mb-6">Neural Forensic Architecture</h2>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full shadow-[0_0_15px_#00F5FF]" />
        </motion.div>

        {/* Section 1: Overview & Dataset */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <InsightCard 
            icon={Cpu}
            title="Model Architecture"
            delay={0.1}
            content={[
              "Backend: EfficientNet-B0 (Transfer Learning)",
              "Input Dim: 224x224x3 (RGB)",
              "Sequence: 1 layer LSTM (256 hidden units)",
              "Classification: Dense Sigmoid Head",
              "Optimization: Adam with BCEWithLogitsLoss"
            ]}
          />
          <InsightCard 
            icon={Database}
            title="Dataset Integrity"
            delay={0.2}
            content={[
              "Volume: 40,000+ Forensic Samples",
              "Source: FaceForensics++ / DFDC (Curated)",
              "Distribution: Balanced Real/Fake (50/50)",
              "Preprocessing: RetinaFace detection + alignment",
              "Augmentation: Gaussian Noise, JPEG Compression"
            ]}
          />
        </div>

        {/* Section 2: Pipeline Visualization */}
        <div className="mb-20 p-12 bg-white/[0.01] border border-white/5 rounded-3xl">
          <div className="flex items-center gap-4 mb-12 justify-center">
            <GitBranch className="w-5 h-5 text-primary/40" />
            <h3 className="text-[10px] font-orbitron font-bold tracking-[0.3em] uppercase opacity-40">System Logic // Flow</h3>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-4">
            <PipelineStep label="Input Stream" sublabel="Image / Video / RT" />
            <div className="w-8 h-[1px] bg-white/10" />
            <PipelineStep label="Preprocessing" sublabel="Normalization" />
            <div className="w-8 h-[1px] bg-white/10" />
            <PipelineStep label="Backbone" sublabel="EfficientNet-B0" />
            <div className="w-8 h-[1px] bg-white/10" />
            <PipelineStep label="Temporal" sublabel="LSTM Analysis" />
            <div className="w-8 h-[1px] bg-white/10" />
            <PipelineStep label="Sigmoid" sublabel="Logit Processing" />
            <div className="w-8 h-[1px] bg-white/10" />
            <PipelineStep label="Verdict" sublabel="REAL / FAKE" />
          </div>
        </div>

        {/* Section 3: Performance & Limitations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <ShieldCheck className="w-8 h-8 text-primary mb-4" />
            <span className="text-3xl font-orbitron font-bold text-white mb-2">98.6%</span>
            <span className="text-[9px] font-mono text-primary uppercase tracking-widest">Core Accuracy</span>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-4 h-4 text-yellow-500/60" />
              <h4 className="text-[9px] font-orbitron font-bold tracking-widest uppercase">Limitations</h4>
            </div>
            <ul className="space-y-3 text-[10px] font-mono text-gray-500 uppercase tracking-tighter">
              <li className="flex gap-2"><span>-</span> Sensitive to extreme motion blur</li>
              <li className="flex gap-2"><span>-</span> Realtime requires GPU acceleration</li>
              <li className="flex gap-2"><span>-</span> Low-light grain impact accuracy</li>
            </ul>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <h4 className="text-[9px] font-orbitron font-bold tracking-widest uppercase">Future Roadmap</h4>
            </div>
            <ul className="space-y-3 text-[10px] font-mono text-gray-500 uppercase tracking-tighter">
              <li className="flex gap-2"><span>-</span> Multi-Modal Audio Analysis</li>
              <li className="flex gap-2"><span>-</span> Edge Deployment (WebAssembly)</li>
              <li className="flex gap-2"><span>-</span> Advanced Gradient Heatmaps</li>
            </ul>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ResearchPage;
