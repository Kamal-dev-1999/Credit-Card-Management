import React, { useState } from 'react';
import { Search, FileText, CheckCircle2, Loader2, CreditCard } from 'lucide-react';// Default Mock Bills mapping to our actual state
const initialBills = [
  { id: 1, cardName: 'Purple Zota Card', last4: '0003', bgClass: 'bg-purple-600', statementDate: '01/02/2026', dueDate: '18/02/2026', amount: 82050.50, status: 'Upcoming' },
  { id: 2, cardName: 'PD Bank', last4: '9012', bgClass: 'bg-yellow-400', statementDate: '08/02/2026', dueDate: '25/02/2026', amount: 203000.00, status: 'Outstanding' },
  { id: 3, cardName: 'Amazon Pay ICICI', last4: '3456', bgClass: 'bg-orange-500', statementDate: '15/02/2026', dueDate: '02/03/2026', amount: 45025.25, status: 'Upcoming' },
  { id: 4, cardName: 'HDFC Regalia', last4: '0003', bgClass: 'bg-blue-600', statementDate: '01/02/2026', dueDate: '18/02/2026', amount: 125000.00, status: 'Paid' },
  { id: 5, cardName: 'Gold Visa Card', last4: '9012', bgClass: 'bg-yellow-400', statementDate: '08/02/2026', dueDate: '25/02/2026', amount: 189000.00, status: 'Paid' },
];

const RecentBillsTable = ({ onPaySuccess }) => {
  const [bills, setBills] = useState(initialBills);
  const [search, setSearch] = useState('');
  const [showPaid, setShowPaid] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  const handleMarkAsPaid = (id) => {
    setLoadingId(id);
    setTimeout(() => {
      const billToPay = bills.find(b => b.id === id);
      setBills(bills.map(b => b.id === id ? { ...b, status: 'Paid' } : b));
      setLoadingId(null);
      if(onPaySuccess && billToPay) onPaySuccess(billToPay);
    }, 1200);
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.cardName.toLowerCase().includes(search.toLowerCase()) || 
                          b.statementDate.includes(search) || 
                          b.dueDate.includes(search);
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
          <div className="flex items-center gap-2 bg-green-50/80 px-2.5 py-1 rounded border border-green-100 shadow-sm mt-1 sm:mt-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse outline outline-2 outline-green-200"></span>
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Synced 5m ago</span>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showPaid} 
              onChange={(e) => setShowPaid(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
            />
            Show Paid
          </label>
          <div className="relative flex-1 md:flex-none">
            <input 
              type="text" 
              placeholder="Search bills..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-50/80 border border-gray-100 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all w-full md:w-64 shadow-inner"
            />
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
            {filteredBills.length > 0 ? filteredBills.map((row) => (
              <tr key={row.id} className="hover:bg-yellow-50/30 transition-colors group">
                <td className="px-4 py-5 border-b border-gray-50 group-last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-6 rounded ${row.bgClass} flex items-center justify-center shadow-sm`}>
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
                <td className="px-4 py-5 font-bold text-gray-800 border-b border-gray-50 group-last:border-0">${row.amount.toFixed(2)}</td>
                <td className="px-4 py-5 border-b border-gray-50 group-last:border-0">
                  {getStatusPill(row.status)}
                </td>
                <td className="px-4 py-5 border-b border-gray-50 group-last:border-0">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-yellow-50 rounded-lg" title="View Statement">
                      <FileText size={18} />
                    </button>
                    {row.status !== 'Paid' && (
                      <button 
                        onClick={() => handleMarkAsPaid(row.id)}
                        disabled={loadingId === row.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-green-400 hover:text-green-600 text-gray-600 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        title="Mark as Paid"
                      >
                        {loadingId === row.id ? (
                          <Loader2 size={14} className="animate-spin text-green-500" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        <span>Pay</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-400 font-medium">
                  No bills found matching your criteria.
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
