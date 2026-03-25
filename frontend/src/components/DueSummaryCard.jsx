import React from 'react';
import { Settings, Plus } from 'lucide-react';

const DueSummaryCard = ({ activeCard }) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-50 flex flex-col justify-between h-full relative overflow-hidden group min-h-[220px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60 pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-6 relative z-10 w-full">
        <h2 className="text-gray-500 font-medium tracking-wide">Total Upcoming Due</h2>
        <div className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 text-sm font-semibold border border-gray-100 shadow-sm shrink-0">
          INR
        </div>
      </div>
      
      <div className="relative z-10 mb-8 mt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-extrabold text-[#1f2937] tracking-tight">
            ₹
          </span>
          <span className="text-5xl sm:text-6xl font-extrabold text-[#1f2937] tracking-tighter">
            {activeCard ? activeCard.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '2,14,850.15'}
          </span>
        </div>
        {activeCard && (
          <p className="text-sm font-medium text-gray-400 mt-2">Specifically due for {activeCard.bankName}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-auto relative z-10 w-full">
        <button className="flex-1 bg-[#ffb000] hover:bg-yellow-500 text-white py-3.5 px-6 rounded-xl font-bold transition-all shadow-lg shadow-yellow-200/50 active:scale-95 flex items-center justify-center gap-2">
          <span>Auto-Pay: <span className="text-yellow-100">ON</span></span>
          <Settings size={18} className="opacity-80" />
        </button>
        <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3.5 px-6 rounded-xl font-bold transition-all border border-gray-200 active:scale-95 flex items-center justify-center gap-2">
          <span>Add Card</span>
          <Plus size={18} className="opacity-70" />
        </button>
      </div>
    </div>
  );
};

export default DueSummaryCard;
