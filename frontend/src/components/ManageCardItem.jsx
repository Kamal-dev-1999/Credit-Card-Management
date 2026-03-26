import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Edit2, Trash2, Cloud, CloudOff } from 'lucide-react';

const ManageCardItem = ({ card, onDelete, onEdit, onToggleSync }) => {
  const [showOverlay, setShowOverlay] = useState(false);

  // Map theme ID to CSS classes or use directly if hex
  const getBackground = () => {
    const themes = {
      'midnight-purple': 'from-purple-900 to-indigo-800',
      'royal-blue':     'from-blue-800 to-blue-600',
      'gold-rush':      'from-yellow-600 to-yellow-400',
      'ruby-red':       'from-rose-700 to-red-600',
      'forest-green':   'from-emerald-800 to-teal-700',
      'luxury-black':   'from-gray-900 to-gray-700',
    };

    if (themes[card.colorTheme]) {
      return `bg-gradient-to-br ${themes[card.colorTheme]}`;
    }
    if (card.colorTheme?.startsWith('#')) {
      return ''; // Handled via inline style
    }
    return 'bg-gradient-to-br from-purple-900 to-purple-600'; // Fallback
  };

  const renderBrand = () => {
    const brand = (card.brand || 'Visa').toLowerCase();
    
    if (brand === 'visa') {
      return <div className="text-3xl font-bold italic opacity-90 drop-shadow-sm">VISA</div>;
    }
    if (brand === 'mastercard') {
      return (
        <div className="flex relative w-10 h-6">
          <div className="w-6 h-6 rounded-full bg-red-500 opacity-90 absolute left-0 mix-blend-multiply"></div>
          <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 absolute left-3 mix-blend-multiply"></div>
        </div>
      );
    }
    if (brand === 'rupay') {
      return (
        <div className="bg-white/20 px-3 py-1 rounded-md backdrop-blur-sm border border-white/20">
          <span className="text-xs font-black italic tracking-tighter">RuPay</span>
        </div>
      );
    }
    if (brand === 'amex') {
      return (
        <div className="bg-blue-600/40 px-3 py-1 rounded-md backdrop-blur-sm border border-blue-400/30">
          <span className="text-xs font-bold tracking-widest">AMEX</span>
        </div>
      );
    }
    return <div className="text-xs font-bold opacity-60 uppercase">{brand}</div>;
  };

  return (
    <div 
      className={`relative w-full rounded-3xl ${getBackground()} text-white shadow-lg overflow-hidden transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-xl aspect-[1.6/1] cursor-pointer`}
      style={{ backgroundColor: card.colorTheme?.startsWith('#') ? card.colorTheme : undefined }}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      onClick={() => setShowOverlay(!showOverlay)}
    >
      {/* Front of Card */}
      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between z-10 pt-6">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
             <span className="font-bold text-lg sm:text-xl tracking-wider drop-shadow-sm">{card.bankName}</span>
             <span className="text-xs text-white/80 font-medium tracking-wide">{card.nickname}</span>
          </div>
          <div className="flex items-center gap-2">
            {card.syncEnabled ? (
              <div className="bg-white/20 p-1.5 rounded-md backdrop-blur-sm" title="Email Auto-Retrieve Enabled">
                <Cloud size={14} className="text-white drop-shadow-md" />
              </div>
            ) : (
              <div className="bg-black/20 p-1.5 rounded-md backdrop-blur-sm" title="Manual Tracking">
                <CloudOff size={14} className="text-white/60" />
              </div>
            )}
            <Wifi className="rotate-90 text-white/80 ml-1" size={20} />
          </div>
        </div>
        
        <div className="text-xl sm:text-2xl font-medium font-mono tracking-[0.14em] sm:tracking-[0.18em] drop-shadow-sm opacity-90 my-auto">
          •••• {card.last4}
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[10px] text-white/80 mb-0.5 tracking-widest uppercase">Next Bill</div>
            <div className="font-medium text-sm drop-shadow-sm">{card.nextBillingDate}</div>
          </div>
          {renderBrand()}
        </div>
      </div>

      {/* Action Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/85 backdrop-blur-sm z-20 p-5 flex flex-col justify-center items-center gap-5 sm:gap-6 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-center gap-5">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(card); }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 border border-white/10 hover:border-white/30"
                title="Edit Card Details"
              >
                <Edit2 size={22} className="opacity-90" />
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(card); }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 border border-red-400/30 hover:shadow-red-500/50"
                title="Delete Card"
              >
                <Trash2 size={22} />
              </button>
            </div>
            
            <div className="w-full sm:w-10/12 mt-2 pt-5 border-t border-white/10 flex flex-col items-center">
               <label className="flex items-center justify-center gap-3 cursor-pointer group w-full">
                  <span className="text-xs sm:text-sm font-semibold text-white/80 group-hover:text-white transition-colors uppercase tracking-wider">
                    Email Auto-Sync
                  </span>
                  <div className="relative inline-block w-12 h-6 align-middle transition duration-200 ease-in ml-auto sm:ml-2">
                    <input 
                      type="checkbox" 
                      className={`absolute block w-6 h-6 rounded-full bg-white border-2 appearance-none cursor-pointer transition-transform duration-300 z-10 ${card.syncEnabled ? 'translate-x-6 border-green-500' : 'border-gray-400'}`}
                      checked={card.syncEnabled}
                      onChange={(e) => {
                         e.stopPropagation();
                         onToggleSync(card.id, e.target.checked);
                      }}
                    />
                    <div 
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer absolute inset-0 transition-colors duration-300 ${card.syncEnabled ? 'bg-green-500/80 border border-green-400' : 'bg-gray-600 border border-gray-500'}`}
                    ></div>
                  </div>
               </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageCardItem;
