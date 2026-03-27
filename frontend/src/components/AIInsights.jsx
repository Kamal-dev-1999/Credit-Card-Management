import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Activity } from 'lucide-react';
import CardInsightTile from './CardInsightTile';
import CreditHealthCard from './CreditHealthCard';

// Mock Data
const activeCards = [
  {
    id: 1, bankName: 'Purple Zota Card', last4: '0003', bgClass: 'from-purple-900 to-purple-600',
    dueDate: '18/04/2026', utilization: 25,
    suggestions: [
      { type: 'strategy', text: 'This bill is ₹82,050. Pay ₹10,000 today to keep utilization under 30%.' },
      { type: 'reward', text: 'Activate the 5x Dining rewards via the portal before the weekend.' },
      { type: 'alert', text: 'Found a 10% discount offer for BookMyShow. Use it for entertainment.' }
    ]
  },
  {
    id: 2, bankName: 'PD Bank', last4: '9012', bgClass: 'from-yellow-500 to-yellow-300',
    dueDate: '25/04/2026', utilization: 65,
    suggestions: [
      { type: 'alert', text: 'High utilization! Paying ₹50,000 will significantly improve your health score.' },
      { type: 'strategy', text: 'You are ₹15,000 away from the annual fee waiver milestone. Shift upcoming spends here.' }
    ]
  },
];

const AIInsights = () => {
  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-8">
      
      {/* Section A: Daily Financial Pulse (Banner) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-gray-900 to-purple-900 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl shadow-purple-900/20 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10 shrink-0"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[80px] opacity-30 -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 opacity-80">
            <Sparkles size={16} className="text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Daily Wealth Pulse</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium leading-normal italic text-white/95">
            "Your wealth grows not from what you make, but from what you don't spend unnecessarily."
          </h2>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shrink-0 flex items-center gap-4 w-full md:w-auto shadow-inner">
          <div className="w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center border border-green-400/50 shrink-0">
             <TrendingUp size={24} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide">On Track Status</p>
            <p className="text-xs text-white/80 font-medium mt-1">Projected to save ₹12,500 this month.</p>
          </div>
        </div>
      </motion.div>

      {/* Grid Layout for Intel & Health Score */}
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 min-h-0">
        
        {/* Section B: Card-Specific Intel Grid */}
        <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 min-w-0">
           {activeCards.map((card, idx) => (
             <motion.div 
               key={card.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.15 }}
               className="h-full"
             >
               <CardInsightTile card={card} />
             </motion.div>
           ))}
        </div>

        {/* Section C: Predictive Financial Health Score */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-[1] min-w-[300px]"
        >
          <CreditHealthCard 
            utilization={28} 
            description="Your score increased because you maintained on-time payments and kept the Purple Zota balance very low. Great job!" 
          />
        </motion.div>
        
      </div>
    </div>
  );
};

export default AIInsights;
