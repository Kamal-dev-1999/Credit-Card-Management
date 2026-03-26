import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle2, Loader2, CreditCard, RefreshCw, Undo2 } from 'lucide-react';

const getBgClass = (bankName = '') => {
  const name = bankName.toLowerCase();
  if (name.includes('zota') || name.includes('purple')) return 'bg-purple-600';
  if (name.includes('pd') || name.includes('yellow')) return 'bg-yellow-400';
  if (name.includes('hdfc')) return 'bg-blue-600';
  if (name.includes('icici') || name.includes('amazon')) return 'bg-orange-500';
  if (name.includes('sbi')) return 'bg-blue-800';
  if (name.includes('axis')) return 'bg-red-600';
  if (name.includes('kotak')) return 'bg-red-500';
  if (name.includes('amex') || name.includes('american')) return 'bg-green-700';
  return 'bg-gray-500';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const RecentBillsTable = ({ onPaySuccess, refreshKey }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPaid, setShowPaid] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  const fetchBills = () => {
    setLoading(true);
    fetch('http://127.0.0.1:5000/api/dashboard/summary')
      .then(r => r.json())
      .then(data => {
        const normalized = (data.bills || []).map(b => ({
          id: b.id,
          cardName: b.cards?.cardname || b.cards?.bankname || 'Unknown Card',
          bankName: b.cards?.bankname || '',
          last4: b.cards?.last4digits || '••••',
          statementDate: formatDate(b.statementdate),
          rawStatementDate: b.statementdate,
          dueDate: formatDate(b.duedate),
          rawDueDate: b.duedate,
          amount: b.amountdue || 0,
          status: b.status || 'Upcoming',
        }));
        setBills(normalized);
        setLastSynced(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchBills(); }, [refreshKey]);

  const updateBillStatus = async (id, newStatus) => {
    setLoadingId(id);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/bills/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      const updated = await res.json();
      const updatedBill = bills.find(b => b.id === id);
      
      if (onPaySuccess && updatedBill) {
        onPaySuccess({ ...updatedBill, status: newStatus });
      } else {
        fetchBills(); // Fallback if prop missing
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = (b.cardName + b.last4 + b.statementDate + b.dueDate)
      .toLowerCase().includes(search.toLowerCase());
    const matchesPaid = showPaid ? true : b.status !== 'Paid';
    return matchesSearch && matchesPaid;
  });

  const getStatusPill = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">Paid</span>;
      case 'Upcoming':
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-200">Upcoming</span>;
      default:
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">Overdue</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-50 flex flex-col w-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <h2 className="font-bold text-gray-800 text-xl tracking-tight">Upcoming Bills & Latest Payments</h2>
          {lastSynced ? (
            <div className="flex items-center gap-2 bg-green-50/80 px-2.5 py-1 rounded border border-green-100 shadow-sm mt-1 sm:mt-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse outline outline-2 outline-green-200"></span>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Synced {lastSynced}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded border border-gray-100 mt-1 sm:mt-0">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Loading...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={fetchBills} title="Refresh" className="p-2 text-gray-400 hover:text-primary hover:bg-yellow-50 rounded-lg transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showPaid} onChange={(e) => setShowPaid(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300" />
            Show Paid
          </label>
          <div className="relative flex-1 md:flex-none">
            <input type="text" placeholder="Search bills..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-50/80 border border-gray-100 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all w-full md:w-64 shadow-inner" />
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>
      
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400 font-medium">
            <tr>
              <th className="px-4 py-4 pb-6 border-b border-gray-100 font-medium tracking-wide">Card</th>
              <th className="px-4 py-4 pb-6 border-b border-gray-100 font-medium tracking-wide whitespace-nowrap">Statement Date</th>
              <th className="px-4 py-4 pb-6 border-b border-gray-100 font-medium tracking-wide whitespace-nowrap">Due Date</th>
              <th className="px-4 py-4 pb-6 border-b border-gray-100 font-medium tracking-wide">Amount Due</th>
              <th className="px-4 py-4 pb-6 border-b border-gray-100 font-medium tracking-wide">Status</th>
              <th className="px-4 py-4 pb-6 border-b border-gray-100 font-medium tracking-wide text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-3 text-gray-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="font-medium">Loading live data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredBills.length > 0 ? filteredBills.map((row) => (
              <tr key={row.id} className="hover:bg-yellow-50/30 transition-colors group">
                <td className="px-4 py-5 border-b border-gray-50 group-last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-6 rounded ${getBgClass(row.bankName || row.cardName)} flex items-center justify-center shadow-sm`}>
                      <CreditCard size={14} className="text-white/80" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">{row.cardName}</div>
                      <div className="text-xs text-gray-400 font-mono tracking-wider">•••• {row.last4}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-5 font-medium text-gray-600 border-b border-gray-50 group-last:border-0">{row.statementDate}</td>
                <td className="px-4 py-5 font-semibold text-gray-700 border-b border-gray-50 group-last:border-0">{row.dueDate}</td>
                <td className="px-4 py-5 font-bold text-gray-800 border-b border-gray-50 group-last:border-0">
                  ₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-5 border-b border-gray-50 group-last:border-0">{getStatusPill(row.status)}</td>
                <td className="px-4 py-5 border-b border-gray-50 group-last:border-0">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-yellow-50 rounded-lg" title="View Statement">
                      <FileText size={18} />
                    </button>
                    {row.status === 'Paid' ? (
                      <button onClick={() => updateBillStatus(row.id, 'Upcoming')} disabled={loadingId === row.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 hover:border-yellow-400 hover:text-yellow-700 text-yellow-600 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        title="Revoke Payment">
                        {loadingId === row.id ? <Loader2 size={14} className="animate-spin text-yellow-500" /> : <Undo2 size={14} />}
                        <span>Revoke</span>
                      </button>
                    ) : (
                      <button onClick={() => updateBillStatus(row.id, 'Paid')} disabled={loadingId === row.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-green-400 hover:text-green-600 text-gray-600 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50">
                        {loadingId === row.id ? <Loader2 size={14} className="animate-spin text-green-500" /> : <CheckCircle2 size={14} />}
                        <span>Pay</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center">
                  <div className="text-gray-400 font-medium">
                    {bills.length === 0 ? 'No bills found. Run a sync to fetch data from Gmail.' : 'No bills match your search.'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentBillsTable;
