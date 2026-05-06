import React from 'react';
import HistoryCard from './HistoryCard';

const HistorySection = ({ history, onCardClick, apiBase }) => {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-orbitron tracking-[0.4em] uppercase text-white/30">Archive // Previous_Forensic_Sessions</h2>
        <div className="h-[1px] flex-1 mx-8 bg-white/5" />
        <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">{history.length} Sessions_Logged</span>
      </div>

      <div className="flex flex-wrap gap-6 pb-6">
        {history.length === 0 ? (
          <div className="w-full py-16 text-center border border-dashed border-white/5 rounded-2xl">
            <p className="font-mono text-[10px] text-gray-700 uppercase tracking-widest">No archival data found in neural buffer</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id}>
              <HistoryCard 
                item={item} 
                onClick={onCardClick} 
                apiBase={apiBase}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default HistorySection;
