import React from 'react';
import { motion } from 'framer-motion';

const CreditHealthCard = ({ utilization = 24, description }) => {
  // Rank logic
  const getRank = (pct) => {
    if (pct < 15) return 'A+';
    if (pct < 30) return 'A-';
    if (pct < 50) return 'B';
    return 'C';
  };

  const rank = getRank(utilization);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (0.85 * circumference); // Fixed 85% for static 'Good' look

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col h-full w-full relative min-h-[300px] items-center text-center overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 w-full justify-start pl-1">
        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-slate-600 font-bold text-sm tracking-tight opacity-80">Predictive Health Score</h3>
      </div>
      
      {/* Grade Circle */}
      <div className="relative flex items-center justify-center flex-1 w-full my-4">
        <svg className="transform -rotate-90 w-36 h-36">
          <circle cx="72" cy="72" r={radius} stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
          <motion.circle 
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            cx="72" cy="72" r={radius} 
            stroke="#10b981" 
            strokeWidth="10" 
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.2))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-slate-800 tracking-tighter">{rank}</span>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-4 mt-auto w-full">
        {description && (
          <p className="text-xs text-gray-400 font-medium px-4 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Status Badge */}
        <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center gap-2 hover:bg-emerald-100 transition-colors cursor-default w-fit shadow-sm">
          <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Trending Up</span>
        </div>
      </div>
    </div>
  );
};

export default CreditHealthCard;
