
import React, { useState, useEffect, useRef } from 'react';
import { 
  AppModule, 
  ChatMessage, 
  StockDataPoint, 
  GhostPattern, 
  OptionStrategy 
} from './types';
import { 
    ParallaxImageBackground, 
    ObsidianPanel, 
    MagmaInput, 
    RetreatButton
} from './components/VolcanicUI';
import { SdaWidget, GpaWidget, StrategyWidget } from './components/ModuleWidgets';
import { sendMessageToGemini, generateVolcanicBackground } from './services/gemini';

// --- Icons ---
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const IconRefresh = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>;

// Fallback background in case API fails
const FALLBACK_BG_GRADIENT = null; // Will trigger CSS gradient fallback

// --- MOCK DATA GENERATORS (For local simulation) ---
const generateMockStockData = (): StockDataPoint[] => {
    const data: StockDataPoint[] = [];
    let price = 100;
    for (let i = 0; i < 20; i++) {
        price = price + (Math.random() - 0.5) * 10;
        data.push({
            time: `T-${20-i}`,
            price: Number(price.toFixed(2)),
            maWeekly: Number((price * (0.9 + Math.random() * 0.2)).toFixed(2)),
            divergence: Math.floor(Math.random() * 100)
        });
    }
    return data;
};

const generateMockGhosts = (): GhostPattern[] => [
    { id: '1', name: 'Phantom Head & Shoulders', symbol: 'BTC', score: 92, description: 'High probability reversal detected in shadow order books.', correlatedSymbol: 'ETH' },
    { id: '2', name: 'Nazgul Dive', symbol: 'TSLA', score: 85, description: 'Sudden liquidity void detected.', correlatedSymbol: 'SPY' },
    { id: '3', name: 'Void Spike', symbol: 'GME', score: 78, description: 'Anomalous volume spike without price movement.', correlatedSymbol: 'AMC' },
];

const generateMockStrategy = (): OptionStrategy => ({
    type: 'Condor',
    symbol: 'SPY',
    profitProb: 88,
    maxProfit: 450,
    maxLoss: 1200,
    breakevenLow: 410,
    breakevenHigh: 440
});

export default function App() {
  // Navigation State
  const [cameraFocus, setCameraFocus] = useState<'none' | 'center' | 'left' | 'right' | 'bottom'>('none');

  // Chat Data
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: 'Barad-dûr Analytics initialized. The palantír awaits your command.',
      timestamp: Date.now()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  
  // Visual Data
  const [bgImage, setBgImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<StockDataPoint[]>([]);
  const [ghostData, setGhostData] = useState<GhostPattern[]>([]);
  const [strategyData, setStrategyData] = useState<OptionStrategy | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Load Background
  useEffect(() => {
    const cachedBg = localStorage.getItem('mordor_bg_cache_v7');
    if (cachedBg && cachedBg.startsWith('data:image')) {
        setBgImage(cachedBg);
    } else {
        handleGenerateWorld();
    }
    
    // Init default mock data
    setChartData(generateMockStockData());
    setGhostData(generateMockGhosts());
    setStrategyData(generateMockStrategy());
  }, []);

  const handleGenerateWorld = async () => {
      setIsGeneratingBg(true);
      
      try {
          const newBg = await generateVolcanicBackground();
          if (newBg) {
              setBgImage(newBg);
              try {
                  localStorage.setItem('mordor_bg_cache_v7', newBg);
              } catch (e) {
                  console.warn("Storage quota exceeded");
              }
          } else {
              setBgImage(FALLBACK_BG_GRADIENT); 
          }
      } catch (err) {
          console.error("Generation error:", err);
          setBgImage(FALLBACK_BG_GRADIENT);
      } finally {
          setIsGeneratingBg(false);
      }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const response = await sendMessageToGemini(chatHistory, userMsg.text);

    const modelText = typeof response.textResponse === 'string' 
        ? response.textResponse 
        : "The data stream is corrupted, but I have visualized the result.";

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: modelText,
      timestamp: Date.now(),
      dataPayload: response.hasData ? {
        type: response.dataType,
        data: response.dataType === 'chart' ? response.chartData :
              response.dataType === 'ghost' ? response.ghostData :
              response.dataType === 'strategy' ? response.strategyData : null
      } : undefined
    };

    if (response.hasData) {
      if (response.dataType === 'chart') setChartData(response.chartData);
      else if (response.dataType === 'ghost') setGhostData(response.ghostData);
      else if (response.dataType === 'strategy') setStrategyData(response.strategyData);
    }

    setChatHistory(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  // --- Local Simulators (Linked to Widgets) ---
  const simulateSda = (ticker: string) => {
      setChartData(generateMockStockData());
      // Optionally add a system message
  };
  
  const simulateGpa = () => {
      setGhostData(generateMockGhosts().map(g => ({ ...g, score: Math.floor(Math.random() * 100) })));
  };

  const simulateStrategy = () => {
      setStrategyData({ ...generateMockStrategy(), profitProb: 60 + Math.floor(Math.random() * 30) });
  };

  // --- Navigation Logic ---
  const handleNavigate = (zone: string) => {
      if (zone === 'center') setCameraFocus('center');
      else if (zone === 'right') setCameraFocus('right');
      else if (zone === 'left') setCameraFocus('left');
      else if (zone === 'bottom') setCameraFocus('bottom');
  };

  const handleRetreat = () => {
      setCameraFocus('none');
  };

  // --- CONTENT NODES ---

  const CenterContent = (
      <ObsidianPanel title="THE EYE'S KNOWLEDGE" className="h-full">
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {chatHistory.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`
                                text-sm p-3 border max-w-[90%] backdrop-blur-md
                                ${msg.role === 'user' 
                                ? 'border-red-500/50 bg-red-950/40 text-red-50 rounded-tl-xl rounded-br-xl' 
                                : 'border-white/10 bg-black/60 text-gray-300 font-mono rounded-tr-xl rounded-bl-xl'}
                            `}>
                                {typeof msg.text === 'string' ? msg.text : "Analysis complete."}
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="text-red-500 animate-pulse text-xs font-mono pl-2 tracking-widest">> DIVINING PROBABILITIES...</div>}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-3 bg-black/40 border-t border-white/5">
                    <form onSubmit={handleSendMessage} className="relative">
                        <MagmaInput 
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="SPEAK TO THE TOWER..."
                            disabled={isLoading}
                            className="pr-10"
                        />
                        <button type="submit" disabled={isLoading} className="absolute right-3 top-2.5 text-red-500 hover:text-white transition-colors">
                            <IconSend />
                        </button>
                    </form>
                </div>
            </div>
      </ObsidianPanel>
  );

  const RightContent = (
      <ObsidianPanel title="MOUNT DOOM VOLATILITY" className="h-full">
             <SdaWidget data={chartData} onSimulate={simulateSda} />
      </ObsidianPanel>
  );

  const LeftContent = (
      <ObsidianPanel title="DEAD MARSHES GHOST RADAR" className="h-full">
            <GpaWidget data={ghostData} onScan={simulateGpa} />
      </ObsidianPanel>
  );

  const BottomContent = (
      <ObsidianPanel title="BLACK GATE STRATEGY BUILDER" className="h-full">
            <StrategyWidget strategy={strategyData} onBuild={simulateStrategy} />
      </ObsidianPanel>
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden text-red-50 bg-[#050000] font-sans selection:bg-red-900 selection:text-white">
      
      <ParallaxImageBackground 
        imageUrl={bgImage} 
        focusZone={cameraFocus} 
        onNavigate={handleNavigate}
        centerNode={CenterContent}
        rightNode={RightContent}
        leftNode={LeftContent}
        bottomNode={BottomContent}
      />

      {/* Global HUD Elements (Only visible on Overview) */}
      <div className={`absolute top-0 left-0 p-6 z-10 transition-opacity duration-500 ${cameraFocus !== 'none' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <h1 className="text-3xl md:text-5xl font-cinzel text-white/90 tracking-[0.2em] drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">
            MORDOR <span className="text-red-600">ANALYTICS</span>
          </h1>
          <p className="text-xs text-white/40 font-mono tracking-widest mt-1">SYS.VER.9.0 // PALANTIR ONLINE</p>
      </div>

      {cameraFocus === 'none' && (
        <div className="absolute bottom-6 right-6 z-20">
            <button 
                onClick={handleGenerateWorld}
                disabled={isGeneratingBg}
                className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-red-900/40 text-red-500/80 hover:text-red-200 border border-red-900/30 rounded backdrop-blur-sm transition-all text-xs font-mono tracking-wider"
            >
                <IconRefresh />
                {isGeneratingBg ? 'REFORGING WORLD...' : 'REGENERATE VIEW'}
            </button>
        </div>
      )}

      {cameraFocus !== 'none' && <RetreatButton onClick={handleRetreat} />}
    </div>
  );
}
