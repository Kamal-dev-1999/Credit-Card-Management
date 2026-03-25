import React from 'react';
import { motion } from 'framer-motion';

const CreditHealthCard = ({ utilization = 24 }) => {
  const getHealthStatus = (pct) => {
    if (pct < 30) return { color: '#22c55e', text: 'Excellent', trackColor: '#dcfce7', labelClass: 'text-green-600' };
    if (pct <= 50) return { color: '#eab308', text: 'Good', trackColor: '#fef08a', labelClass: 'text-yellow-600' };
    return { color: '#ef4444', text: 'Warning', trackColor: '#fee2e2', labelClass: 'text-red-500' };
  };

  const status = getHealthStatus(utilization);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (utilization / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col h-full w-full relative min-h-[220px]">
      <h3 className="text-gray-500 font-medium text-sm tracking-wide mb-2">Credit Health</h3>
      
      <div className="relative flex items-center justify-center flex-1 w-full my-2">
        <svg className="transform -rotate-90 w-28 h-28 drop-shadow-sm">
          {/* Background circle */}
          <circle 
            cx="56" cy="56" r={radius} 
            stroke={status.trackColor} 
            strokeWidth="8" 
            fill="transparent" 
          />
          {/* Progress circle */}
          <motion.circle 
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            cx="56" cy="56" r={radius} 
            stroke={status.color} 
            strokeWidth="8" 
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
          <span className="text-xl font-bold text-gray-800">{utilization}%</span>
          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">Used</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 text-center font-medium mt-auto px-2">
        Your credit health is <span className={`font-bold ${status.labelClass}`}>{status.text}</span>.
      </p>
    </div>
  );
};

export default CreditHealthCard;
