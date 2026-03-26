import React, { useState, useEffect } from 'react';
import { Settings, Plus, RefreshCw } from 'lucide-react';

const DueSummaryCard = ({ activeCard }) => {
  const [totalDue, setTotalDue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const fetchSummary = () => {
    setLoading(true);
    fetch('/api/dashboard/summary')
      .then(r => r.json())
      .then(data => {
        setTotalDue(data.totalDue ?? null);
        setLastSync(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, [activeCard]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      // Allow some time for background sync
      setTimeout(() => {
        fetchSummary();
        setIsSyncing(false);
      }, 3000);
    } catch (err) {
      console.error('Sync failed:', err);
      setIsSyncing(false);
    }
  };

  // If a specific card is selected, show its total from live bills
  const displayAmount = activeCard?.dueAmount ?? totalDue;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-50 flex flex-col justify-between h-full relative overflow-hidden group min-h-[220px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60 pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-6 relative z-10 w-full">
        <h2 className="text-gray-500 font-medium tracking-wide">Total Upcoming Due</h2>
        <div className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 text-sm font-semibold border border-gray-100 shadow-sm shrink-0 uppercase tracking-widest text-[10px]">
          INR
        </div>
      </div>
      
      <div className="relative z-10 mb-8 mt-2">
        {loading && !isSyncing ? (
          <div className="flex items-center gap-3 text-gray-400">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-lg font-medium">Fetching live data...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#1f2937] tracking-tight">₹</span>
              <span className="text-5xl sm:text-6xl font-extrabold text-[#1f2937] tracking-tighter">
                {displayAmount != null
                  ? displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '—'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button 
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`flex items-center gap-1.5 transition-all duration-300 ${isSyncing ? 'text-blue-500' : 'text-green-500 hover:text-green-600'}`}
              >
                <RefreshCw size={12} className={`${isSyncing ? 'animate-spin' : 'hover:rotate-180 transition-transform duration-500'}`} />
                <span className="text-[11px] font-bold tracking-tight uppercase">
                  {isSyncing ? 'Syncing Gmail...' : lastSync ? `Last synced ${lastSync}` : 'Live from synced emails'}
                </span>
              </button>
            </div>
          </div>
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
