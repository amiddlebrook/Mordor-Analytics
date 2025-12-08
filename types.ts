export interface StockDataPoint {
  time: string;
  price: number;
  maWeekly: number;
  divergence: number;
}

export interface GhostPattern {
  id: string;
  name: string;
  symbol: string;
  score: number; // 0-100
  description: string;
  correlatedSymbol: string;
}

export interface OptionStrategy {
  type: 'Condor' | 'Butterfly' | 'Straddle';
  symbol: string;
  profitProb: number;
  maxProfit: number;
  maxLoss: number;
  breakevenLow: number;
  breakevenHigh: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  dataPayload?: {
    type: 'chart' | 'ghost' | 'strategy';
    data: any;
  };
  timestamp: number;
}

export enum AppModule {
  DASHBOARD = 'DASHBOARD',
  SDA = 'SDA', // Stock Divergence Analyzer
  GPA = 'GPA', // Ghost Pattern Analyzer
  CONDOR = 'CONDOR', // Options Strategy
}