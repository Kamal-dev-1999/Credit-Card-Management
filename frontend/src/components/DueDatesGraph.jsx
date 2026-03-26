import React, { useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const initialData = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  return {
    day,
    name: day.toString(),
    card1Spend: day <= 18 ? (day * 4500) + Math.random() * 2000 : (18 * 4500) + Math.random() * 2000,
    card2Spend: day <= 25 ? (day * 8000) + Math.random() * 3000 : (25 * 8000) + Math.random() * 3000,
  };
});

const dueDates = [
  { day: 18, card: 'Purple Zota Card', amount: 82050.50, dataKey: 'card1Spend', color: '#ffb000' },
  { day: 25, card: 'Gold Visa Card', amount: 203000.00, dataKey: 'card2Spend', color: '#e5e7eb' }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dueDay = dueDates.find(d => d.day.toString() === label);
    
    return (
      <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100 z-50 relative min-w-[150px]">
        <p className="font-bold text-gray-700 mb-2">Day {label}</p>
        
        {dueDay && payload.some(p => p.dataKey === dueDay.dataKey) && (
          <div className="mb-3 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <p className="text-xs font-bold text-red-500 tracking-wider">DUE DATE</p>
            </div>
            <p className="text-sm font-semibold text-gray-800">{dueDay.card}</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">₹{dueDay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        )}

        <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Cumulative Spend</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-sm text-gray-600 flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color === '#e5e7eb' ? '#d1d5db' : entry.color }}></span>
              {entry.dataKey === 'card1Spend' ? 'Purple Zota' : 'Gold Visa'}
            </span>
            <span className="font-medium">₹{entry.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomDot = (props) => {
  const { cx, cy, payload, dataKey } = props;
  const dueDay = dueDates.find(d => d.day.toString() === payload.name && d.dataKey === dataKey);
  
  if (dueDay) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#ef4444" className="animate-pulse" />
      </g>
    );
  }
  return null;
};

const DueDatesGraph = () => {
  const [view, setView] = useState('month');
  const [selectedCard, setSelectedCard] = useState('all');

  const filteredData = view === 'month' ? initialData : initialData.slice(0, 7);

  const ticks = view === 'month' ? [3, 6, 9, 12, 15, 18, 21, 24, 27, 30] : [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col relative w-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <select 
            value={view} 
            onChange={(e) => setView(e.target.value)}
            className="px-3 py-1.5 h-8 rounded-lg bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors border border-gray-100 shadow-sm text-xs font-medium focus:outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer appearance-none pr-8 relative"
            style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239ca3af%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            <option value="month">Month View</option>
            <option value="week">Week View</option>
          </select>

          <select 
            value={selectedCard} 
            onChange={(e) => setSelectedCard(e.target.value)}
            className="px-3 py-1.5 h-8 rounded-lg bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors border border-gray-100 shadow-sm text-xs font-medium focus:outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer appearance-none pr-8 relative"
            style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239ca3af%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            <option value="all">All Cards</option>
            <option value="card1">Purple Zota</option>
            <option value="card2">Gold Visa</option>
          </select>
        </div>
        <h2 className="text-gray-500 font-medium text-sm tracking-wide hidden sm:block">Spending Cycle & Due Dates</h2>
      </div>
      
      <div className="flex-1 w-full h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCard1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffb000" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ffb000" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              ticks={ticks.map(String)}
              tick={{fill: '#9ca3af', fontSize: 11, fontWeight: 500}} 
              dy={10} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2, strokeDasharray: '5 5' }} />
            
            {(selectedCard === 'all' || selectedCard === 'card2') && (
              <Area 
                type="monotone" 
                dataKey="card2Spend" 
                stroke="#e5e7eb" 
                strokeWidth={3} 
                fill="none" 
                dot={<CustomDot dataKey="card2Spend" />} 
                activeDot={false} 
                isAnimationActive={true}
              />
            )}
            
            {(selectedCard === 'all' || selectedCard === 'card1') && (
              <Area 
                type="monotone" 
                dataKey="card1Spend" 
                stroke="#ffb000" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorCard1)" 
                dot={<CustomDot dataKey="card1Spend" />} 
                activeDot={false} 
                isAnimationActive={true}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DueDatesGraph;
