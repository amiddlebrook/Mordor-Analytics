
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { StockDataPoint, GhostPattern, OptionStrategy } from '../types';

// --- Stock Chart (SDA) ---
export const StockDivergenceChart: React.FC<{ data: StockDataPoint[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-center p-10 text-red-500/50 font-mono">NO DATA STREAM</div>;

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="time" stroke="#9ca3af" tick={{fill: '#d1d5db', fontSize: 10}} />
          <YAxis stroke="#9ca3af" tick={{fill: '#d1d5db', fontSize: 10}} domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: '#ef4444', color: '#fca5a5' }}
            itemStyle={{ color: '#fff' }}
          />
          <Area type="monotone" dataKey="price" stroke="#ef4444" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} name="Price" />
          <Area type="monotone" dataKey="maWeekly" stroke="#f97316" fillOpacity={0.5} fill="url(#colorMa)" strokeWidth={2} strokeDasharray="5 5" name="Weekly MA" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Ghost Pattern Visualizer (GPA) ---
export const GhostPatternRadar: React.FC<{ patterns: GhostPattern[] }> = ({ patterns }) => {
  if (!patterns || patterns.length === 0) return null;

  const radarData = patterns.map(p => ({
    subject: p.name,
    A: p.score,
    fullMark: 100,
  }));

  return (
    <div className="h-[350px] w-full relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <div className="w-64 h-64 rounded-full border border-green-500/30 animate-pulse"></div>
        <div className="w-48 h-48 rounded-full border border-green-400/20 absolute animate-spin-slow" style={{animationDuration: '10s'}}></div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
          <PolarGrid gridType="circle" stroke="#ffffff20" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#86efac', fontSize: 11, fontFamily: 'monospace' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#166534" tick={false} />
          <Radar name="Ghost Score" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: '#22c55e' }} itemStyle={{ color: '#fff' }}/>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Strategy Card (Condor) ---
export const StrategyVisualizer: React.FC<{ strategy: OptionStrategy }> = ({ strategy }) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-950/40 to-black p-4 rounded border border-green-900/50">
          <p className="text-[10px] text-green-400 uppercase tracking-widest mb-1">Max Profit</p>
          <p className="text-3xl font-tech text-green-400 drop-shadow-lg">${strategy.maxProfit}</p>
        </div>
        <div className="bg-gradient-to-br from-red-950/40 to-black p-4 rounded border border-red-900/50">
          <p className="text-[10px] text-red-400 uppercase tracking-widest mb-1">Max Loss</p>
          <p className="text-3xl font-tech text-red-500 drop-shadow-lg">${strategy.maxLoss}</p>
        </div>
      </div>
      
      <div className="relative h-10 bg-gray-900/50 rounded-sm overflow-hidden border border-gray-700">
        <div 
            className="absolute top-0 h-full bg-gradient-to-r from-emerald-900 to-emerald-500 transition-all duration-1000" 
            style={{ width: `${strategy.profitProb}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center z-10 mix-blend-difference">
          <span className="font-bold text-white text-sm tracking-wider">
            PROBABILITY: {strategy.profitProb}%
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-400 font-mono space-y-2 bg-black/40 p-3 rounded border border-white/5">
        <div className="flex justify-between border-b border-white/5 pb-1">
          <span>STRATEGY</span>
          <span className="text-orange-400">{strategy.type}</span>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1">
          <span>BREAKEVEN LOW</span>
          <span className="text-white">${strategy.breakevenLow}</span>
        </div>
        <div className="flex justify-between">
          <span>BREAKEVEN HIGH</span>
          <span className="text-white">${strategy.breakevenHigh}</span>
        </div>
      </div>
    </div>
  );
};
