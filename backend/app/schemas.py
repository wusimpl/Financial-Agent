from __future__ import annotations

from enum import Enum, IntEnum
from typing import Any

from pydantic import BaseModel, Field


class StockIdentity(BaseModel):
    ticker: str
    company_name: str
    company_identifier: str
    cik: str | None = None
    cik_padded: str | None = None
    exchange: str | None = None


class StockSearchItem(BaseModel):
    identity: StockIdentity
    match_reason: str | None = None


class WatchlistItem(BaseModel):
    identity: StockIdentity
    sort_order: int
    latest_price: float | None = None
    change_percent: float | None = None


class QuoteSnapshot(BaseModel):
    price: float | None = None
    change: float | None = None
    change_percent: float | None = None
    currency: str = "USD"
    updated_at: str | None = None


class MarketStatusValue(str, Enum):
    pre_market = "pre_market"
    open = "open"
    after_hours = "after_hours"
    overnight = "overnight"
    closed = "closed"


class MarketStatus(BaseModel):
    status: MarketStatusValue
    label: str
    is_open: bool
    checked_at: str


class IntradaySummary(BaseModel):
    open: float | None = None
    high: float | None = None
    low: float | None = None
    previous_close: float | None = None


class VolumeSummary(BaseModel):
    volume: float | None = None
    average_volume: float | None = None


class ValuationMetrics(BaseModel):
    market_cap: float | None = None
    pe_ratio: float | None = None
    beta: float | None = None
    eps: float | None = None
    target_price: float | None = None


class FinancialCalendar(BaseModel):
    next_earnings_date: str | None = None


class DividendInfo(BaseModel):
    next_dividend_date: str | None = None
    ex_dividend_date: str | None = None
    dividend_yield: float | None = None


class PriceRange52Week(BaseModel):
    low: float | None = None
    high: float | None = None


class StockOverviewResponse(BaseModel):
    identity: StockIdentity
    quote: QuoteSnapshot
    market_status: MarketStatus
    intraday: IntradaySummary
    volume: VolumeSummary
    valuation: ValuationMetrics
    financial_calendar: FinancialCalendar
    dividend: DividendInfo
    price_range_52_week: PriceRange52Week


class ChartRange(str, Enum):
    one_day = "1D"
    five_day = "5D"
    one_month = "1M"
    three_month = "3M"
    six_month = "6M"
    year_to_date = "YTD"
    one_year = "1Y"
    five_year = "5Y"
    all = "All"


class ChartPoint(BaseModel):
    date: str
    open: float | None = None
    high: float | None = None
    low: float | None = None
    close: float | None = None
    volume: float | None = None
    ma20: float | None = None
    ma50: float | None = None
    ma200: float | None = None
    rsi14: float | None = None
    macd: float | None = None
    macd_signal: float | None = None
    macd_hist: float | None = None


class ChartResponse(BaseModel):
    ticker: str
    range: ChartRange
    points: list[ChartPoint] = Field(default_factory=list)


class FilingFilter(BaseModel):
    ticker: str
    year: int | None = None
    filing_type: str | None = None


class FilingSummary(BaseModel):
    ticker: str
    form_type: str
    filing_date: str | None = None
    report_date: str | None = None
    accession_number: str
    primary_document: str
    document_url: str | None = None


class FilingMetadata(BaseModel):
    form_type: str
    report_period: str | None = None
    company_name: str
    accession_number: str
    state_of_incorporation: str | None = None
    employer_identification_number: str | None = None
    cik: str | None = None


class FilingSection(BaseModel):
    name: str
    title: str
    content: str


class FilingDocumentResponse(BaseModel):
    ticker: str
    metadata: FilingMetadata
    document: str
    sections: list[FilingSection] = Field(default_factory=list)


class FinancialSummary(BaseModel):
    ticker: str
    period_end: str | None = None
    net_sales: float | None = None
    cost_of_sales: float | None = None
    gross_profit: float | None = None


class FinancialYear(BaseModel):
    year: int
    year_end: str | None = None
    revenue: float | None = None
    cost: float | None = None
    gross_profit: float | None = None
    operating_profit: float | None = None
    net_income: float | None = None
    eps: float | None = None


class FinancialHistoryResponse(BaseModel):
    ticker: str
    summary: FinancialSummary | None = None
    years: list[FinancialYear] = Field(default_factory=list)


class SocialSort(str, Enum):
    hot = "hot"
    latest = "latest"


class SocialLanguage(str, Enum):
    zh = "zh"
    en = "en"


class SocialMinFaves(IntEnum):
    one = 1
    five = 5
    ten = 10
    thirty = 30
    fifty = 50
    one_hundred = 100
    five_hundred = 500
    one_thousand = 1000


class SocialAuthor(BaseModel):
    name: str
    handle: str | None = None
    avatar: str | None = None


class SocialPost(BaseModel):
    id: str
    author: SocialAuthor
    content: str
    published_at: str | None = None
    relative_time: str | None = None
    replies: int = 0
    reposts: int = 0
    likes: int = 0
    views: int | None = None
    raw: dict[str, Any] | None = None


class SocialPostsResponse(BaseModel):
    ticker: str
    sort: SocialSort
    language: SocialLanguage = SocialLanguage.zh
    min_faves: int = 30
    items: list[SocialPost] = Field(default_factory=list)


class SourceState(BaseModel):
    ok: bool
    empty: bool
    error: str | None = None
    updated_at: str


class DashboardResponse(BaseModel):
    ticker: str
    overview: StockOverviewResponse | None = None
    chart: ChartResponse
    financials: FinancialHistoryResponse
    social: SocialPostsResponse
    sources: dict[str, SourceState] = Field(default_factory=dict)


class ApiErrorResponse(BaseModel):
    error: str
    message: str
