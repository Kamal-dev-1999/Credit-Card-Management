import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, TrendingUp, Gift, ShieldAlert } from 'lucide-react';

const CardInsightTile = ({ card }) => {
  // Determine utilization color
  const utilColor = card.utilization < 30 ? 'bg-green-500' : card.utilization < 50 ? 'bg-yellow-500' : 'bg-red-500';
  const utilTrack = card.utilization < 30 ? 'bg-green-100' : card.utilization < 50 ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full transform transition-transform hover:-translate-y-1 hover:shadow-md">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.bgClass} flex items-center justify-center shadow-inner`}>
            <CreditCard size={20} className="text-white drop-shadow-sm" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm tracking-tight">{card.bankName}</h3>
            <p className="text-xs text-gray-400 font-medium tracking-wide">•••• {card.last4}</p>
          </div>
        </div>
        <div className="px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
           <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Next: {card.dueDate}</span>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Utilization</span>
          <span className="text-sm font-bold text-gray-800">{card.utilization}%</span>
        </div>
        <div className={`w-full h-2 rounded-full ${utilTrack} overflow-hidden`}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${card.utilization}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className={`h-full ${utilColor}`}
          ></motion.div>
        </div>
      </div>

      {/* LLM Suggestions */}
      <div className="flex flex-col gap-3 mt-auto flex-1">
        <h4 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">AI Action Items</h4>
        
        {card.suggestions.map((sug, idx) => (
          <div key={idx} className="flex gap-3 group items-start">
             <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-primary group-hover:text-white transition-colors text-gray-400">
               {sug.type === 'strategy' && <TrendingUp size={12} />}
               {sug.type === 'reward' && <Gift size={12} />}
               {sug.type === 'alert' && <ShieldAlert size={12} />}
             </div>
             <p className="text-xs text-gray-600 font-medium leading-relaxed group-hover:text-gray-900 transition-colors">
               {sug.text}
             </p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default CardInsightTile;
