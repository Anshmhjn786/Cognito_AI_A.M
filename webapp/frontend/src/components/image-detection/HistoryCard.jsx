import React from 'react';
import { motion } from 'framer-motion';

const HistoryCard = ({ item, onClick, apiBase }) => {
  const isFake = item.prediction === 'FAKE';
  const imgPath = item.saved_image_path || item.image;
  // Ensure we don't double the base URL
  const src = imgPath?.startsWith('http') ? imgPath : `${apiBase}${imgPath}`;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={() => onClick(item)}
      className="flex-shrink-0 w-64 bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="aspect-video relative overflow-hidden bg-black">
        <img 
          src={src} 
          alt="Archived" 
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
        />
        <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-sm text-[7px] font-bold tracking-widest uppercase ${isFake ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
          {item.prediction}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-white tracking-widest">{(item.confidence * 100).toFixed(0)}% CONF</span>
          <span className="text-[7px] font-mono text-gray-600 uppercase tracking-tighter">ID_{String(item.id).slice(-4)}</span>
        </div>
        <div className="text-[7px] font-mono text-gray-700 uppercase tracking-widest">{item.timestamp}</div>
      </div>
    </motion.div>
  );
};

export default HistoryCard;
