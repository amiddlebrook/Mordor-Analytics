
import React, { useState } from 'react';
import { StockDataPoint, GhostPattern, OptionStrategy } from '../types';
import { StockDivergenceChart, GhostPatternRadar, StrategyVisualizer } from './Visualizers';
import { MagmaInput } from './VolcanicUI';

// --- Shared Components ---

const ModuleHeader: React.FC<{ title: string; subtitle: string; color: string }> = ({ title, subtitle, color }) => (
    <div className={`border-b border-${color}-500/30 pb-2 mb-4 flex justify-between items-end`}>
        <div>
            <h3 className={`text-${color}-500 font-cinzel tracking-[0.2em] font-bold`}>{title}</h3>
            <p className={`text-[10px] text-${color}-400/60 font-mono tracking-widest`}>{subtitle}</p>
        </div>
        <div className={`flex gap-1`}>
            {[1,2,3].map(i => <div key={i} className={`w-1 h-1 bg-${color}-500/50 rounded-full animate-pulse`} style={{animationDelay: `${i*0.2}s`}} />)}
        </div>
    </div>
);

const RuneButton: React.FC<{ onClick?: () => void; label: string; active?: boolean; color: string }> = ({ onClick, label, active, color }) => (
    <button 
        onClick={onClick}
        className={`
            px-3 py-1 text-[10px] font-mono tracking-widest border transition-all duration-300
            ${active 
                ? `bg-${color}-500/20 border-${color}-500 text-${color}-100 shadow-[0_0_10px_rgba(239,68,68,0.2)]` 
                : `bg-black/40 border-${color}-900/30 text-${color}-500/60 hover:border-${color}-500/50 hover:text-${color}-400`}
        `}
    >
        {label}
    </button>
);

// --- MOUNT DOOM: SDA WIDGET ---

export const SdaWidget: React.FC<{ data: StockDataPoint[]; onSimulate: (ticker: string) => void }> = ({ data, onSimulate }) => {
    const [ticker, setTicker] = useState('NVDA');
    const [timeframe, setTimeframe] = useState('1W');

    // Mock Watchlist
    const watchlist = [
        { sym: 'TSLA', val: '+12.4%', status: 'CRITICAL' },
        { sym: 'AMD', val: '-5.2%', status: 'COOLING' },
        { sym: 'GME', val: '+42.0%', status: 'ERUPTING' },
    ];

    return (
        <div className="flex flex-col h-full bg-black/20 p-4">
            <ModuleHeader title="VOLATILITY ENGINE" subtitle="SECTOR: ORODRUIN // ERUPTION TRACKING" color="orange" />
            
            <div className="flex gap-4 h-full">
                {/* Left: Controls & Watchlist */}
                <div className="w-1/3 flex flex-col gap-4 border-r border-orange-900/20 pr-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-orange-500/50 font-mono">TARGET ASSET</label>
                        <div className="flex gap-2">
                            <MagmaInput 
                                value={ticker} 
                                onChange={e => setTicker(e.target.value)} 
                                className="!py-1 !text-xs !bg-orange-950/20 !border-orange-900/40 text-orange-100"
                            />
                            <button 
                                onClick={() => onSimulate(ticker)}
                                className="px-3 bg-orange-600/20 border border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-black transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-1 justify-between">
                        {['1D', '1W', '1M'].map(tf => (
                            <RuneButton 
                                key={tf} 
                                label={tf} 
                                color="orange" 
                                active={timeframe === tf} 
                                onClick={() => setTimeframe(tf)} 
                            />
                        ))}
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <label className="text-[10px] text-orange-500/50 font-mono mb-2 block">ACTIVE ERUPTIONS</label>
                        <div className="space-y-1">
                            {watchlist.map(item => (
                                <div key={item.sym} className="flex justify-between items-center p-2 bg-black/40 border border-orange-900/20 hover:border-orange-500/40 cursor-pointer group transition-colors">
                                    <span className="font-bold text-orange-100 text-xs">{item.sym}</span>
                                    <div className="text-right">
                                        <div className={`text-xs ${item.val.startsWith('+') ? 'text-red-400' : 'text-blue-400'}`}>{item.val}</div>
                                        <div className="text-[8px] text-orange-500/40 tracking-wider group-hover:text-orange-400">{item.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Visualization */}
                <div className="w-2/3 flex flex-col">
                    <div className="flex-1 bg-gradient-to-b from-orange-950/10 to-transparent border border-orange-900/10 rounded relative">
                         <StockDivergenceChart data={data} />
                         {/* Overlay Data */}
                         <div className="absolute top-2 left-2 flex gap-4">
                            <div>
                                <div className="text-[10px] text-orange-500/50">DIVERGENCE SCORE</div>
                                <div className="text-xl font-tech text-orange-500">88.4%</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-orange-500/50">MAGMA PRESURE</div>
                                <div className="text-xl font-tech text-red-500 animate-pulse">CRITICAL</div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- DEAD MARSHES: GPA WIDGET ---

export const GpaWidget: React.FC<{ data: GhostPattern[]; onScan: () => void }> = ({ data, onScan }) => {
    const [sensitivity, setSensitivity] = useState(75);

    return (
        <div className="flex flex-col h-full bg-black/20 p-4">
            <ModuleHeader title="GHOST RADAR" subtitle="SECTOR: MARSHES // SPECTRAL ANALYSIS" color="green" />
            
            <div className="flex gap-4 h-full">
                {/* Left: Visualization Radar */}
                <div className="w-1/2 relative">
                    <div className="absolute inset-0 bg-green-900/5 rounded-full filter blur-xl animate-pulse"></div>
                    <GhostPatternRadar patterns={data} />
                    <div className="absolute bottom-0 w-full text-center">
                        <button 
                            onClick={onScan}
                            className="px-6 py-2 bg-green-950/40 border border-green-500/50 text-green-400 font-mono text-xs tracking-[0.2em] hover:bg-green-500 hover:text-black transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                        >
                            INITIATE SCAN
                        </button>
                    </div>
                </div>

                {/* Right: Pattern List */}
                <div className="w-1/2 flex flex-col gap-4 border-l border-green-900/20 pl-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-green-500/50 font-mono">
                            <span>SPECTRAL SENSITIVITY</span>
                            <span>{sensitivity}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={sensitivity} 
                            onChange={(e) => setSensitivity(Number(e.target.value))}
                            className="w-full h-1 bg-green-900/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:rounded-full"
                        />
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                         <label className="text-[10px] text-green-500/50 font-mono block sticky top-0 bg-black/0 backdrop-blur-sm">DETECTED ENTITIES</label>
                         {data.length > 0 ? data.map(pattern => (
                             <div key={pattern.id} className="p-3 bg-green-950/10 border border-green-900/30 hover:bg-green-950/30 transition-colors">
                                 <div className="flex justify-between items-start mb-1">
                                     <span className="text-green-300 font-bold text-xs">{pattern.name}</span>
                                     <span className="text-green-500 font-mono text-xs">{pattern.score}%</span>
                                 </div>
                                 <p className="text-[10px] text-green-400/60 leading-tight">{pattern.description}</p>
                                 <div className="mt-2 flex justify-between items-center text-[9px] text-green-500/30 font-mono">
                                     <span>LINK: {pattern.correlatedSymbol}</span>
                                     <span>ID: {pattern.id.substring(0,4)}</span>
                                 </div>
                             </div>
                         )) : (
                             <div className="text-green-500/30 text-xs font-mono text-center py-10">
                                 NO SPECTRAL SIGNATURES DETECTED
                             </div>
                         )}
                     </div>
                </div>
            </div>
        </div>
    );
};

// --- BLACK GATE: STRATEGY WIDGET ---

export const StrategyWidget: React.FC<{ strategy: OptionStrategy | null; onBuild: () => void }> = ({ strategy, onBuild }) => {
    const [type, setType] = useState('CONDOR');
    const [risk, setRisk] = useState('MED');

    return (
        <div className="flex flex-col h-full bg-black/20 p-4">
            <ModuleHeader title="WAR STRATEGIST" subtitle="SECTOR: MORANNON // OPTIONS DEPLOYMENT" color="gray" />
            
            <div className="flex gap-6 h-full">
                {/* Left: Builder Form */}
                <div className="w-1/3 flex flex-col gap-6 pt-2">
                    <div className="space-y-3">
                        <label className="text-[10px] text-gray-500 font-mono tracking-widest">FORMATION TYPE</label>
                        <div className="grid grid-cols-1 gap-2">
                            {['CONDOR', 'BUTTERFLY', 'STRADDLE'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`
                                        text-left px-4 py-3 text-xs font-mono tracking-wider border transition-all
                                        ${type === t 
                                            ? 'bg-gray-800 border-gray-400 text-white' 
                                            : 'bg-black/40 border-gray-800 text-gray-500 hover:border-gray-600'}
                                    `}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] text-gray-500 font-mono tracking-widest">RISK TOLERANCE</label>
                        <div className="flex gap-2">
                            {['LOW', 'MED', 'HIGH'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRisk(r)}
                                    className={`
                                        flex-1 py-2 text-[10px] font-bold border transition-all
                                        ${risk === r
                                            ? r === 'HIGH' ? 'bg-red-900/50 border-red-500 text-red-100' : 'bg-gray-700 border-gray-400 text-white'
                                            : 'bg-black/40 border-gray-800 text-gray-600'}
                                    `}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button 
                            onClick={onBuild}
                            className="w-full py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-500 text-gray-200 font-cinzel font-bold tracking-[0.2em] hover:text-white hover:border-white transition-all shadow-lg active:scale-95"
                        >
                            FORGE STRATEGY
                        </button>
                    </div>
                </div>

                {/* Right: Visualizer */}
                <div className="w-2/3 bg-black/40 border border-gray-800 p-6 flex flex-col justify-center relative overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    {strategy ? (
                        <div className="relative z-10 animate-in fade-in zoom-in duration-500">
                             <StrategyVisualizer strategy={strategy} />
                        </div>
                    ) : (
                        <div className="relative z-10 text-center opacity-50">
                            <div className="text-4xl mb-2 text-gray-700">⚔️</div>
                            <div className="text-xs font-mono text-gray-500 tracking-widest">AWAITING TACTICAL INPUT</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
