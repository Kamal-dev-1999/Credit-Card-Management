import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DuesBreakdownChart = ({ refreshKey }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDue, setTotalDue] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch('http://127.0.0.1:5000/api/dashboard/dues-distribution')
      .then(r => r.json())
      .then(dist => {
        setData(dist);
        setTotalDue(dist.reduce((s, d) => s + d.value, 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  if (loading && data.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 h-[300px] flex items-center justify-center">
        <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Loading Dues...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-50 h-[300px] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
           <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
           </svg>
        </div>
        <h3 className="text-gray-800 font-bold text-sm mb-1 uppercase tracking-tight">All Settled!</h3>
        <p className="text-gray-400 text-[10px] font-medium leading-relaxed uppercase tracking-wider">You have no outstanding dues across your cards.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col relative min-h-[350px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Dues Distribution</h2>
        <div className="text-[10px] font-black text-gray-900 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
           {data.length} {data.length === 1 ? 'Card' : 'Cards'}
        </div>
      </div>

      <div className="flex-1 relative min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-gray-100 z-50">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{payload[0].name}</p>
                      <p className="text-sm font-black text-gray-900">₹{payload[0].value.toLocaleString('en-IN')}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outstanding</p>
          <p className="text-xl font-black text-gray-900 tracking-tight">₹{Math.round(totalDue / 1000)}k</p>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
        {data.sort((a,b) => b.value - a.value).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors uppercase tracking-tight truncate max-w-[120px]">
                {item.name}
              </span>
            </div>
            <span className="text-[11px] font-black text-gray-900">
               {Math.round((item.value / totalDue) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DuesBreakdownChart;
