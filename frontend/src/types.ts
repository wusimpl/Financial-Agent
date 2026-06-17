import type { MarketStatusValue, SourceState } from './api/backendTypes';

export interface StockInfo {
  ticker: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  marketCap: string;
  peRatio: number | null;
  dividendYield: string;
  range52Week: string;
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  volume: string;
  avgVolume: string;
  beta: number | null;
  eps: number | null;
  earningsDate: string;
  targetEst: number | null;
  nextDividendDate?: string;
  exDividendDate?: string;
  marketStatus?: MarketStatusValue;
}

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  ma20?: number | null;
  ma50?: number | null;
  ma200?: number | null;
  rsi14?: number | null;
  macd?: number | null;
  macdSignal?: number | null;
  macdHist?: number | null;
}

export interface FinancialYear {
  yearEnded: string;
  netSales: number | null;
  costOfSales: number | null;
  grossProfit: number | null;
  operatingExpenses: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  eps: number | null;
}

export interface InsightData {
  label: string;
  value: string;
  subtext: string;
  trend: 'up' | 'down';
  history: number[];
}

export interface Tweet {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  timeAgo: string;
  sentiment?: 'Bullish' | 'Bearish' | 'Neutral';
  replies: number;
  retweets: number;
  likes: number;
  views: string;
}

export interface StockData {
  info: StockInfo;
  chart: ChartDataPoint[];
  financials: FinancialYear[];
  insights: InsightData[];
  tweets: Tweet[];
  sources?: Record<string, SourceState>;
}
