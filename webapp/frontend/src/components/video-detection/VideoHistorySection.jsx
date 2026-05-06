import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Play } from 'lucide-react';

const VideoHistoryCard = ({ item, onClick, apiBase }) => {
  const isFake = item.prediction === 'FAKE';
  const thumbnail = item.frames?.[0];
  const src = thumbnail?.startsWith('http') || thumbnail?.startsWith('blob:') ? thumbnail : `${apiBase}${thumbnail}`;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => onClick(item)}
      className="group cursor-pointer bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all shadow-xl"
    >
      <div className="aspect-video relative overflow-hidden bg-black">
        <img 
          src={src} 
          alt="History" 
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
          onError={(e) => {
            e.target.style.opacity = 0.2;
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary fill-primary" />
          </div>
        </div>
        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-sm text-[7px] font-bold tracking-widest uppercase ${isFake ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
          {item.prediction}
        </div>
      </div>
      <div className="p-4 bg-black/40 border-t border-white/5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-white tracking-widest">{(item.confidence * 100).toFixed(0)}% CONF</span>
          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-tighter">{item.timestamp}</span>
        </div>
        <div className="flex items-center gap-2 text-[7px] font-mono text-gray-700 uppercase tracking-widest">
          <Clock className="w-2.5 h-2.5" /> {item.frames?.length || 0} Frames Analyzed
        </div>
      </div>
    </motion.div>
  );
};

const VideoHistorySection = ({ history, onCardClick, apiBase }) => {
  return (
    <div className="mt-24 space-y-8 pb-32">
      <div className="flex items-center gap-6 px-4">
        <h2 className="text-[10px] font-orbitron tracking-[0.4em] uppercase text-white/40">Temporal Archive // Historical_Logs</h2>
        <div className="h-[1px] flex-1 bg-white/5" />
      </div>

      {history.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl mx-4">
          <p className="font-mono text-[10px] text-gray-700 uppercase tracking-widest">No historical video data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          {history.map((item) => (
            <VideoHistoryCard 
              key={item.id} 
              item={item} 
              onClick={onCardClick} 
              apiBase={apiBase}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoHistorySection;
