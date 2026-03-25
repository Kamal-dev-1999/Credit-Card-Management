import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AITipCard = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      className="bg-gradient-to-r from-yellow-400 to-primary rounded-2xl p-5 shadow-lg shadow-yellow-200 flex items-center justify-between text-white cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all w-full relative overflow-hidden group"
    >
      {/* Decorative Blur */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-start sm:items-center gap-4 relative z-10">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-sm backdrop-blur-sm relative">
           <div className="absolute inset-0 bg-yellow-300 rounded-full animate-ping opacity-30"></div>
           <Sparkles size={20} className="text-white drop-shadow-sm" />
        </div>
        <div>
          <h4 className="font-bold text-sm sm:text-base drop-shadow-sm tracking-wide">
            AI Smart Insight
          </h4>
          <p className="text-xs sm:text-sm font-medium mt-1 text-yellow-50 drop-shadow-sm max-w-lg leading-relaxed">
            Use your <span className="font-bold text-white bg-white/20 px-1.5 py-0.5 rounded mx-0.5">Purple Zota Card</span> for Grocery shopping today to earn 3x reward points!
          </p>
        </div>
      </div>
      
      <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/30 ml-4 shrink-0 transition-transform group-hover:translate-x-1.5 shadow-inner">
        <ArrowRight size={16} />
      </div>
    </motion.div>
  );
};

export default AITipCard;
