import { StockData } from './types';

export const mockStocks: Record<string, StockData> = {
  AAPL: {
    info: {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      price: 195.27,
      change: 1.42,
      changePercent: 0.73,
      marketCap: '$3.02T',
      peRatio: 31.47,
      dividendYield: '0.48%',
      range52Week: '164.08 - 199.62',
      open: 193.42,
      high: 196.08,
      low: 192.91,
      prevClose: 193.85,
      volume: '58.32M',
      avgVolume: '52.11M',
      beta: 1.29,
      eps: 6.21,
      earningsDate: 'Jul 31',
      targetEst: 204.32,
    },
    financials: [
      { yearEnded: 'Sep 30, 2023', netSales: 383285, costOfSales: 210705, grossProfit: 172579, operatingExpenses: 62886, operatingIncome: 109693, netIncome: 82723, eps: 5.97 },
      { yearEnded: 'Sep 24, 2022', netSales: 394328, costOfSales: 223546, grossProfit: 170782, operatingExpenses: 60845, operatingIncome: 109937, netIncome: 90303, eps: 6.11 },
      { yearEnded: 'Sep 25, 2021', netSales: 365817, costOfSales: 212981, grossProfit: 152836, operatingExpenses: 56437, operatingIncome: 96399, netIncome: 84399, eps: 5.61 },
      { yearEnded: 'Sep 26, 2020', netSales: 274515, costOfSales: 169559, grossProfit: 104956, operatingExpenses: 38387, operatingIncome: 66569, netIncome: 57692, eps: 3.31 },
    ],
    insights: [
      { label: 'Revenue Growth', value: '2.02%', subtext: '5-Yr CAGR', trend: 'up', history: [100, 105, 110, 150, 160, 155, 170] },
      { label: 'Net Income Growth', value: '1.30%', subtext: '5-Yr CAGR', trend: 'up', history: [50, 55, 52, 70, 85, 80, 82] },
      { label: 'Gross Margin', value: '45.0%', subtext: 'Latest Fiscal Year', trend: 'up', history: [38, 38.5, 39, 41, 43, 44.5, 45] },
      { label: 'Operating Margin', value: '28.6%', subtext: 'Latest Fiscal Year', trend: 'up', history: [22, 23, 24, 28, 30, 29, 28.6] },
    ],
    chart: Array.from({ length: 90 }).map((_, i) => {
      const base = 170 + i * 0.3 + Math.sin(i * 0.15) * 15;
      const open = base + (Math.random() - 0.5) * 5;
      const close = base + (Math.random() - 0.5) * 5;
      const high = Math.max(open, close) + Math.random() * 3 + 1;
      const low = Math.min(open, close) - Math.random() * 3 - 1;

      const rsi14 = 50 + Math.sin(i * 0.3) * 20 + (Math.random() - 0.5) * 10;
      const macd = Math.sin(i * 0.15) * 3;
      const macdSignal = macd - Math.cos(i * 0.15) * 0.8;
      const macdHist = macd - macdSignal;

      return {
        date: `2023-${String(Math.floor(i/30) + 1).padStart(2,'0')}-${String((i%30)+1).padStart(2,'0')}`,
        open, high, low, close,
        volume: 40 + Math.random() * 60,
        ma20: base - 2 + Math.random() * 2,
        ma50: base - 5 + Math.random() * 2,
        ma200: base - 12 + Math.random() * 2,
        rsi14, macd, macdSignal, macdHist
      };
    }),
    tweets: [
      { id: '1', author: 'TechInvesting', handle: '@TechInvesting', avatar: 'T', content: 'Apple\'s services segment is an absolute cash machine. $AAPL continues to show incredible ecosystem strength. Long-term bull case remains intact. 🍎', timeAgo: '3h', sentiment: 'Bullish', replies: 23, retweets: 87, likes: 412, views: '28K' },
      { id: '2', author: 'OptionsSwing', handle: '@OptionsSwing', avatar: 'O', content: 'Notable flow in $AAPL weekly calls today. Big players positioning for a move above $200? Earnings in focus. 👀', timeAgo: '5h', sentiment: 'Bullish', replies: 15, retweets: 34, likes: 210, views: '19K' },
      { id: '3', author: 'ValueAnalyzer', handle: '@ValueAnalyzer', avatar: 'V', content: 'At ~28x forward earnings, $AAPL isn\'t cheap, but the balance sheet and buyback program provide a strong floor. High quality compounder.', timeAgo: '6h', sentiment: 'Neutral', replies: 18, retweets: 26, likes: 183, views: '16K' },
      { id: '4', author: 'BearishTrader', handle: '@BearishTrader', avatar: 'B', content: 'China risk, regulation, and iPhone saturation are real headwinds. I\'m staying cautious on $AAPL here.', timeAgo: '9h', sentiment: 'Bearish', replies: 45, retweets: 12, likes: 89, views: '12K' },
    ]
  },
  TSLA: {
    info: { ticker: 'TSLA', name: 'Tesla Inc.', price: 175.22, change: -3.45, changePercent: -1.93, marketCap: '$556B', peRatio: 42.1, dividendYield: 'N/A', range52Week: '152.37 - 299.29', open: 178.00, high: 179.50, low: 174.10, prevClose: 178.67, volume: '98.5M', avgVolume: '105.2M', beta: 2.1, eps: 4.15, earningsDate: 'Oct 18', targetEst: 210.00 },
    financials: [], // Minimal mock for other symbols to allow switching
    insights: [],
    chart: [],
    tweets: []
  },
  MSFT: {
    info: { ticker: 'MSFT', name: 'Microsoft Corp.', price: 420.55, change: 5.12, changePercent: 1.23, marketCap: '$3.12T', peRatio: 36.5, dividendYield: '0.71%', range52Week: '309.45 - 430.82', open: 418.20, high: 422.10, low: 417.50, prevClose: 415.43, volume: '22.1M', avgVolume: '25.3M', beta: 0.95, eps: 11.52, earningsDate: 'Jul 25', targetEst: 450.00 },
    financials: [],
    insights: [],
    chart: [],
    tweets: []
  }
};
