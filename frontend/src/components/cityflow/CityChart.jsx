import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'

export function CityChart({ city }) {
  if (!city || !city.history || city.history.length === 0) {
    return (
      <div className="h-32 w-full bg-slate-900 rounded-lg border border-slate-800 my-4 flex items-center justify-center text-slate-500 text-xs">
        Collecting data...
      </div>
    )
  }

  // Format tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-2 rounded text-xs font-mono">
          <p className="text-sky-400">Pop: {payload[0].value.toFixed(1)}k</p>
          <p className="text-red-400">Stress: {payload[1].value.toFixed(1)}%</p>
          <p className="text-emerald-400">Eco Health: {payload[2].value.toFixed(1)}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-36 w-full bg-slate-900/50 rounded-lg border border-slate-800 my-4 p-2 relative">
      <div className="absolute top-2 right-2 flex flex-col gap-1 text-[9px] font-mono text-slate-400 z-10 text-right">
        <div className="flex items-center gap-1 justify-end"><span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span> Population</div>
        <div className="flex items-center gap-1 justify-end"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Stress</div>
        <div className="flex items-center gap-1 justify-end"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Eco Avg</div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={city.history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          
          {/* Left Y Axis for Population */}
          <YAxis 
            yAxisId="left" 
            tick={{ fontSize: 9, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          
          {/* Right Y Axis for Percentages (Stress, Eco) */}
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fontSize: 9, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="pop" 
            stroke="#38bdf8" 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="stress" 
            stroke="#f87171" 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="eco" 
            stroke="#34d399" 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
