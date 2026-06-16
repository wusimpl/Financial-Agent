from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.watchlist import WatchlistStore
from app.logic.market import MarketStatusResolver
from app.logic.tickers import TickerNormalizer
from app.schemas import (
    DividendInfo,
    FinancialCalendar,
    IntradaySummary,
    PriceRange52Week,
    QuoteSnapshot,
    StockIdentity,
    StockOverviewResponse,
    StockSearchItem,
    ValuationMetrics,
    VolumeSummary,
    WatchlistItem,
)
from app.sources.stocks import MarketProfileSource, StockDirectorySource


class StockSearchService:
    def __init__(self, directory_source: StockDirectorySource | None = None) -> None:
        self.directory_source = directory_source or StockDirectorySource()

    def search(self, query: str, limit: int = 10) -> list[StockSearchItem]:
        result = self.directory_source.search(query, limit=limit)
        return [StockSearchItem(identity=self._identity(item), match_reason="ticker_or_company") for item in result["items"]]

    @staticmethod
    def _identity(company: dict[str, Any]) -> StockIdentity:
        ticker = str(company.get("ticker", "")).upper()
        return StockIdentity(
            ticker=ticker,
            company_name=str(company.get("title") or company.get("company_name") or ticker),
            company_identifier=ticker,
            cik=str(company.get("cik") or "") or None,
            cik_padded=company.get("cikPadded") or company.get("cik_padded"),
            exchange=company.get("exchange"),
        )


class WatchlistService:
    def __init__(
        self,
        store: WatchlistStore | None = None,
        directory_source: StockDirectorySource | None = None,
    ) -> None:
        self.store = store or WatchlistStore()
        self.directory_source = directory_source or StockDirectorySource()

    def list_items(self) -> list[WatchlistItem]:
        items: list[WatchlistItem] = []
        for index, ticker in enumerate(self.store.list_tickers()):
            company = self.directory_source.find(ticker)
            items.append(WatchlistItem(identity=StockSearchService._identity(company), sort_order=index))
        return items


class StockOverviewService:
    def __init__(
        self,
        directory_source: StockDirectorySource | None = None,
        profile_source: MarketProfileSource | None = None,
        status_resolver: MarketStatusResolver | None = None,
    ) -> None:
        self.directory_source = directory_source or StockDirectorySource()
        self.profile_source = profile_source or MarketProfileSource()
        self.status_resolver = status_resolver or MarketStatusResolver()

    def overview(self, ticker: str) -> StockOverviewResponse:
        normalized = TickerNormalizer.normalize(ticker)
        company = self.directory_source.find(normalized)
        profile = self.profile_source.quote(normalized)["profile"]
        price = profile.get("price", {})
        summary = profile.get("summaryDetail", {})
        statistics = profile.get("defaultKeyStatistics", {})
        financial = profile.get("financialData", {})
        calendar = profile.get("calendarEvents", {})

        identity = StockSearchService._identity(company)
        company_name = self._raw(price.get("longName")) or self._raw(price.get("shortName"))
        if company_name:
            identity.company_name = str(company_name)

        return StockOverviewResponse(
            identity=identity,
            quote=QuoteSnapshot(
                price=self._raw(price.get("regularMarketPrice")),
                change=self._raw(price.get("regularMarketChange")),
                change_percent=self._raw(price.get("regularMarketChangePercent")),
                currency=str(self._raw(price.get("currency")) or "USD"),
                updated_at=self._date_time(price.get("regularMarketTime")),
            ),
            market_status=self.status_resolver.resolve(),
            intraday=IntradaySummary(
                open=self._first_raw(price.get("regularMarketOpen"), summary.get("open")),
                high=self._first_raw(price.get("regularMarketDayHigh"), summary.get("dayHigh")),
                low=self._first_raw(price.get("regularMarketDayLow"), summary.get("dayLow")),
                previous_close=self._first_raw(price.get("regularMarketPreviousClose"), summary.get("previousClose")),
            ),
            volume=VolumeSummary(
                volume=self._first_raw(price.get("regularMarketVolume"), summary.get("volume")),
                average_volume=self._first_raw(price.get("averageDailyVolume3Month"), summary.get("averageVolume")),
            ),
            valuation=ValuationMetrics(
                market_cap=self._raw(summary.get("marketCap")),
                pe_ratio=self._raw(summary.get("trailingPE")),
                beta=self._raw(statistics.get("beta")),
                eps=self._first_raw(statistics.get("trailingEps"), statistics.get("forwardEps")),
                target_price=self._raw(financial.get("targetMeanPrice")),
            ),
            financial_calendar=FinancialCalendar(
                next_earnings_date=self._first_earnings_date(calendar.get("earnings", {})),
            ),
            dividend=DividendInfo(
                next_dividend_date=self._date(summary.get("dividendDate")),
                ex_dividend_date=self._date(summary.get("exDividendDate")),
                dividend_yield=self._raw(summary.get("dividendYield")),
            ),
            price_range_52_week=PriceRange52Week(
                low=self._raw(summary.get("fiftyTwoWeekLow")),
                high=self._raw(summary.get("fiftyTwoWeekHigh")),
            ),
        )

    @classmethod
    def _first_raw(cls, *values: Any) -> Any:
        for value in values:
            raw = cls._raw(value)
            if raw is not None:
                return raw
        return None

    @staticmethod
    def _raw(value: Any) -> Any:
        if isinstance(value, dict):
            return value.get("raw")
        return value

    @classmethod
    def _date(cls, value: Any) -> str | None:
        raw = cls._raw(value)
        if raw is None:
            return None
        try:
            return datetime.fromtimestamp(int(raw), tz=timezone.utc).date().isoformat()
        except (TypeError, ValueError, OSError):
            return str(raw)

    @classmethod
    def _date_time(cls, value: Any) -> str | None:
        raw = cls._raw(value)
        if raw is None:
            return None
        try:
            return datetime.fromtimestamp(int(raw), tz=timezone.utc).isoformat()
        except (TypeError, ValueError, OSError):
            return str(raw)

    @classmethod
    def _first_earnings_date(cls, earnings: dict[str, Any]) -> str | None:
        dates = earnings.get("earningsDate")
        if isinstance(dates, list) and dates:
            return cls._date(dates[0])
        return None
