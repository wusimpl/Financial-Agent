export interface StockInfo {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio: number;
  dividendYield: string;
  range52Week: string;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: string;
  avgVolume: string;
  beta: number;
  eps: number;
  earningsDate: string;
  targetEst: number;
}

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20: number;
  ma50: number;
  ma200?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
}

export interface FinancialYear {
  yearEnded: string;
  netSales: number;
  costOfSales: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
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
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
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
}
