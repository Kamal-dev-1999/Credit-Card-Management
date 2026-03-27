import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import CardInsightTile from './CardInsightTile';
import CreditHealthCard from './CreditHealthCard';

const AIInsights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchInsights = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/ai/latest');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const manualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/ai/sync', { method: 'POST' });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-8 animate-pulse p-8">
        <div className="h-48 bg-gray-100 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="h-64 bg-gray-100 rounded-3xl" />
          <div className="h-64 bg-gray-100 rounded-3xl" />
          <div className="h-64 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  const insights = data || {
    daily_quote: "Your wealth grows from what you keep, not just what you make.",
    projected_savings: 0,
    card_insights: [],
    health_explanation: "Keep maintaining on-time payments to see your health score rise."
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-8 relative">
      
      {/* Sync Button */}
      <button 
        onClick={manualSync}
        disabled={syncing}
        className="absolute top-0 right-0 z-50 p-3 bg-white/80 backdrop-blur shadow-sm border border-gray-100 rounded-2xl hover:bg-white transition-all group"
      >
        <RefreshCw size={18} className={`text-slate-400 group-hover:text-purple-600 ${syncing ? 'animate-spin' : ''}`} />
      </button>

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
            "{insights.daily_quote}"
          </h2>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shrink-0 flex items-center gap-4 w-full md:w-auto shadow-inner">
          <div className="w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center border border-green-400/50 shrink-0">
             <TrendingUp size={24} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide">On Track Status</p>
            <p className="text-xs text-white/80 font-medium mt-1">Projected to save ₹{insights.projected_savings.toLocaleString('en-IN')} this month.</p>
          </div>
        </div>
      </motion.div>

      {/* Grid Layout for Intel & Health Score */}
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 min-h-0">
        
        {/* Section B: Card-Specific Intel Grid */}
        <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 min-w-0">
           {(insights.card_insights || []).length > 0 ? (
             insights.card_insights.map((card, idx) => (
               <motion.div 
                 key={card.id || idx}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.15 }}
                 className="h-full"
               >
                 <CardInsightTile card={card} />
               </motion.div>
             ))
           ) : (
             <div className="col-span-full h-48 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-300">
                <p className="text-sm font-bold uppercase tracking-widest">No Card Intel Available</p>
                <p className="text-xs opacity-60">Sync your debt profile to generate daily strategies.</p>
             </div>
           )}
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
            description={insights.health_explanation}
          />
        </motion.div>
        
      </div>
    </div>
  );
};

export default AIInsights;
