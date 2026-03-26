import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#ffb000', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b'];

const CustomTooltip = ({ active, payload, label, dueDates = [] }) => {
  if (active && payload && payload.length) {
    const dueDay = (dueDates || []).find(d => d.day.toString() === label);
    
    return (
      <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100 z-50 relative min-w-[180px]">
        <p className="font-bold text-gray-700 mb-2 border-b border-gray-50 pb-1 text-xs uppercase tracking-widest">Day {label}</p>
        
        {dueDay && (
          <div className="mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <p className="text-[10px] font-bold text-red-500 tracking-wider">PAYMENT DUE</p>
            </div>
            <p className="text-sm font-bold text-gray-800">{dueDay.bank}</p>
            <p className="text-sm font-black text-gray-900 mt-0.5">₹{dueDay.amount.toLocaleString('en-IN')}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Projected Spend</p>
          {payload.map((entry, idx) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke }}></span>
                {entry.dataKey.replace('Spend', '')}
              </span>
              <span className="font-bold text-gray-800 text-xs">₹{Math.round(entry.value).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomDot = (props) => {
  const { cx, cy, payload, dataKey, dueDates = [] } = props;
  const bankName = dataKey.replace('Spend', '');
  const isDue = (dueDates || []).some(d => d.day.toString() === payload.name && d.bank === bankName);
  
  if (isDue) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={8} fill="#ef4444" fillOpacity={0.2} className="animate-pulse" />
      </g>
    );
  }
  return null;
};

const DueDatesGraph = ({ refreshKey }) => {
  const [view, setView] = useState('month');
  const [graphData, setGraphData] = useState([]);
  const [seriesKeys, setSeriesKeys] = useState([]);
  const [dueDates, setDueDates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/dashboard/graph-data?v=1');
      const json = await res.json();
      setGraphData(json.data || []);
      setSeriesKeys(json.keys || []);
      setDueDates(json.dueDates || []);
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, [refreshKey]);

  const filteredData = view === 'month' ? graphData : graphData.slice(0, 7);
  const ticks = view === 'month' ? [1, 5, 10, 15, 20, 25, 31] : [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col relative w-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <select 
            value={view} 
            onChange={(e) => setView(e.target.value)}
            className="px-3 py-1.5 h-8 rounded-lg bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors border border-gray-100 shadow-sm text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer appearance-none pr-8 relative"
            style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239ca3af%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            <option value="month">Month View</option>
            <option value="week">Week View</option>
          </select>
        </div>
        <h2 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest hidden sm:block">Spending Cycle & Due Dates</h2>
      </div>
      
      <div className="flex-1 w-full min-h-[300px] relative min-w-0">
        {loading && graphData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-bold text-xs uppercase tracking-widest">
            Loading cycle data...
          </div>
        ) : graphData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-bold text-xs uppercase tracking-widest text-center px-8">
            Sync your emails to see your spending cycle
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="300" aspect={3}>
            <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {seriesKeys.map((key, idx) => (
                  <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                ticks={ticks.map(String)}
                tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} 
                dy={10} 
              />
              <Tooltip 
                content={<CustomTooltip dueDates={dueDates} />} 
                cursor={{ stroke: '#f3f4f6', strokeWidth: 1 }} 
              />
              
              {seriesKeys.map((key, idx) => (
                <Area 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[idx % COLORS.length]} 
                  strokeWidth={3} 
                  fill={`url(#grad-${key})`}
                  dot={<CustomDot dueDates={dueDates} dataKey={key} />} 
                  activeDot={{ r: 4, strokeWidth: 0, fill: COLORS[idx % COLORS.length] }}
                  isAnimationActive={true}
                  connectNulls={true}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default DueDatesGraph;
