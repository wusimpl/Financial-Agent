from __future__ import annotations

from app.logic.charts import ChartRangeMapper, TechnicalIndicatorCalculator
from app.logic.tickers import TickerNormalizer
from app.schemas import ChartRange, ChartResponse
from app.sources.market import MarketSource


class ChartDataService:
    def __init__(
        self,
        market_source: MarketSource | None = None,
        range_mapper: ChartRangeMapper | None = None,
        indicator_calculator: TechnicalIndicatorCalculator | None = None,
    ) -> None:
        self.market_source = market_source or MarketSource()
        self.range_mapper = range_mapper or ChartRangeMapper()
        self.indicator_calculator = indicator_calculator or TechnicalIndicatorCalculator()

    def chart(self, ticker: str, chart_range: ChartRange | str = ChartRange.one_year) -> ChartResponse:
        normalized = TickerNormalizer.normalize(ticker)
        normalized_range = ChartRange(chart_range)
        params = self.range_mapper.map(normalized_range)
        raw = self.market_source.us_kline(normalized, count=params.count, period=params.period)
        points = self.indicator_calculator.with_indicators(raw.get("items", []))
        return ChartResponse(ticker=normalized, range=normalized_range, points=points)
