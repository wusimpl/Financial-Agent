export type ChartRange = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'All';

export type SocialSort = 'hot' | 'latest';

export type MarketStatusValue = 'pre_market' | 'open' | 'after_hours' | 'overnight' | 'closed';

export interface StockIdentity {
  ticker: string;
  company_name: string;
  company_identifier: string;
  cik?: string | null;
  cik_padded?: string | null;
  exchange?: string | null;
}

export interface StockSearchItem {
  identity: StockIdentity;
  match_reason?: string | null;
}

export interface WatchlistItem {
  identity: StockIdentity;
  sort_order: number;
  latest_price?: number | null;
  change_percent?: number | null;
}

export interface QuoteSnapshot {
  price?: number | null;
  change?: number | null;
  change_percent?: number | null;
  currency: string;
  updated_at?: string | null;
}

export interface MarketStatus {
  status: MarketStatusValue;
  label: string;
  is_open: boolean;
  checked_at: string;
}

export interface IntradaySummary {
  open?: number | null;
  high?: number | null;
  low?: number | null;
  previous_close?: number | null;
}

export interface VolumeSummary {
  volume?: number | null;
  average_volume?: number | null;
}

export interface ValuationMetrics {
  market_cap?: number | null;
  pe_ratio?: number | null;
  beta?: number | null;
  eps?: number | null;
  target_price?: number | null;
}

export interface FinancialCalendar {
  next_earnings_date?: string | null;
}

export interface DividendInfo {
  next_dividend_date?: string | null;
  ex_dividend_date?: string | null;
  dividend_yield?: number | null;
}

export interface PriceRange52Week {
  low?: number | null;
  high?: number | null;
}

export interface StockOverviewResponse {
  identity: StockIdentity;
  quote: QuoteSnapshot;
  market_status: MarketStatus;
  intraday: IntradaySummary;
  volume: VolumeSummary;
  valuation: ValuationMetrics;
  financial_calendar: FinancialCalendar;
  dividend: DividendInfo;
  price_range_52_week: PriceRange52Week;
}

export interface ChartPoint {
  date: string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
  ma20?: number | null;
  ma50?: number | null;
  ma200?: number | null;
  rsi14?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
  macd_hist?: number | null;
}

export interface ChartResponse {
  ticker: string;
  range: ChartRange;
  points: ChartPoint[];
}

export interface FilingSummary {
  ticker: string;
  form_type: string;
  filing_date?: string | null;
  report_date?: string | null;
  accession_number: string;
  primary_document: string;
  document_url?: string | null;
}

export interface FilingMetadata {
  form_type: string;
  report_period?: string | null;
  company_name: string;
  accession_number: string;
  state_of_incorporation?: string | null;
  employer_identification_number?: string | null;
  cik?: string | null;
}

export interface FilingSection {
  name: string;
  title: string;
  content: string;
}

export interface FilingDocumentResponse {
  ticker: string;
  metadata: FilingMetadata;
  document: string;
  sections: FilingSection[];
}

export interface FinancialSummary {
  ticker: string;
  period_end?: string | null;
  net_sales?: number | null;
  cost_of_sales?: number | null;
  gross_profit?: number | null;
}

export interface BackendFinancialYear {
  year: number;
  year_end?: string | null;
  revenue?: number | null;
  cost?: number | null;
  gross_profit?: number | null;
  operating_profit?: number | null;
  net_income?: number | null;
  eps?: number | null;
}

export interface FinancialHistoryResponse {
  ticker: string;
  summary?: FinancialSummary | null;
  years: BackendFinancialYear[];
}

export interface SocialAuthor {
  name: string;
  handle?: string | null;
  avatar?: string | null;
}

export interface SocialPost {
  id: string;
  author: SocialAuthor;
  content: string;
  published_at?: string | null;
  relative_time?: string | null;
  replies: number;
  reposts: number;
  likes: number;
  views?: number | null;
}

export interface SocialPostsResponse {
  ticker: string;
  sort: SocialSort;
  items: SocialPost[];
}

export interface SourceState {
  ok: boolean;
  empty: boolean;
  error?: string | null;
  updated_at: string;
}

export interface DashboardResponse {
  ticker: string;
  overview?: StockOverviewResponse | null;
  chart: ChartResponse;
  financials: FinancialHistoryResponse;
  social: SocialPostsResponse;
  sources: Record<string, SourceState>;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}
