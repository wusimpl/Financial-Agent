import type {
  ChartPoint,
  DashboardResponse,
  FinancialHistoryResponse,
  MarketStatusValue,
  SocialPost,
  StockOverviewResponse,
} from './backendTypes';
import type { ChartDataPoint, FinancialYear, StockData, StockInfo, Tweet } from '../types';

function compactNumber(value?: number | null) {
  if (value === null || value === undefined) return '—';

  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;

  return value.toLocaleString();
}

function compactCurrency(value?: number | null) {
  const formatted = compactNumber(value);
  return formatted === '—' ? formatted : `$${formatted}`;
}

function percent(value?: number | null) {
  if (value === null || value === undefined) return '—';
  return `${(value * 100).toFixed(2)}%`;
}

function dateLabel(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function rangeLabel(low?: number | null, high?: number | null) {
  if (low === null || low === undefined || high === null || high === undefined) return '—';
  return `${low.toFixed(2)} - ${high.toFixed(2)}`;
}

function toStockInfo(ticker: string, overview?: StockOverviewResponse | null): StockInfo {
  return {
    ticker: overview?.identity.ticker || ticker,
    name: overview?.identity.company_name || ticker,
    price: overview?.quote.price ?? null,
    change: overview?.quote.change ?? null,
    changePercent: overview?.quote.change_percent ?? null,
    marketCap: compactCurrency(overview?.valuation.market_cap),
    peRatio: overview?.valuation.pe_ratio ?? null,
    dividendYield: percent(overview?.dividend.dividend_yield),
    range52Week: rangeLabel(overview?.price_range_52_week.low, overview?.price_range_52_week.high),
    open: overview?.intraday.open ?? null,
    high: overview?.intraday.high ?? null,
    low: overview?.intraday.low ?? null,
    prevClose: overview?.intraday.previous_close ?? null,
    volume: compactNumber(overview?.volume.volume),
    avgVolume: compactNumber(overview?.volume.average_volume),
    beta: overview?.valuation.beta ?? null,
    eps: overview?.valuation.eps ?? null,
    earningsDate: dateLabel(overview?.financial_calendar.next_earnings_date),
    targetEst: overview?.valuation.target_price ?? null,
    nextDividendDate: dateLabel(overview?.dividend.next_dividend_date),
    exDividendDate: dateLabel(overview?.dividend.ex_dividend_date),
    marketStatus: overview?.market_status.status as MarketStatusValue | undefined,
  };
}

function hasPricePoint(point: ChartPoint) {
  return (
    point.open !== null &&
    point.open !== undefined &&
    point.high !== null &&
    point.high !== undefined &&
    point.low !== null &&
    point.low !== undefined &&
    point.close !== null &&
    point.close !== undefined
  );
}

function toChartPoint(point: ChartPoint): ChartDataPoint {
  return {
    date: point.date,
    open: point.open as number,
    high: point.high as number,
    low: point.low as number,
    close: point.close as number,
    volume: point.volume ?? null,
    ma20: point.ma20 ?? null,
    ma50: point.ma50 ?? null,
    ma200: point.ma200 ?? null,
    rsi14: point.rsi14 ?? null,
    macd: point.macd ?? null,
    macdSignal: point.macd_signal ?? null,
    macdHist: point.macd_hist ?? null,
  };
}

function toFinancialYears(financials: FinancialHistoryResponse): FinancialYear[] {
  return financials.years.map((year) => ({
    yearEnded: year.year_end || String(year.year),
    netSales: year.revenue ?? null,
    costOfSales: year.cost ?? null,
    grossProfit: year.gross_profit ?? null,
    operatingExpenses: null,
    operatingIncome: year.operating_profit ?? null,
    netIncome: year.net_income ?? null,
    eps: year.eps ?? null,
  }));
}

function toAvatar(post: SocialPost) {
  if (post.author.avatar) return post.author.avatar;
  return (post.author.name || post.author.handle || '?').slice(0, 1).toUpperCase();
}

function toTweet(post: SocialPost): Tweet {
  return {
    id: post.id,
    author: post.author.name,
    handle: post.author.handle || '',
    avatar: toAvatar(post),
    content: post.content,
    timeAgo: post.relative_time || dateLabel(post.published_at),
    replies: post.replies,
    retweets: post.reposts,
    likes: post.likes,
    views: compactNumber(post.views),
  };
}

export function adaptDashboard(response: DashboardResponse): StockData {
  return {
    info: toStockInfo(response.ticker, response.overview),
    chart: response.chart.points.filter(hasPricePoint).map(toChartPoint),
    financials: toFinancialYears(response.financials),
    insights: [],
    tweets: response.social.items.map(toTweet),
    sources: response.sources,
  };
}
