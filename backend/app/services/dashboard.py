from __future__ import annotations

from app.errors import SourceStatusBuilder
from app.logic.tickers import TickerNormalizer
from app.schemas import ChartRange, ChartResponse, DashboardResponse, FinancialHistoryResponse, SocialPostsResponse, SocialSort
from app.services.charts import ChartDataService
from app.services.financials import FinancialDataService
from app.services.social import SocialPostService
from app.services.stocks import StockOverviewService


class DashboardService:
    def __init__(
        self,
        overview_service: StockOverviewService | None = None,
        chart_service: ChartDataService | None = None,
        financial_service: FinancialDataService | None = None,
        social_service: SocialPostService | None = None,
        status_builder: SourceStatusBuilder | None = None,
    ) -> None:
        self.overview_service = overview_service or StockOverviewService()
        self.chart_service = chart_service or ChartDataService()
        self.financial_service = financial_service or FinancialDataService()
        self.social_service = social_service or SocialPostService()
        self.status_builder = status_builder or SourceStatusBuilder()

    def dashboard(
        self,
        ticker: str,
        chart_range: ChartRange | str = ChartRange.one_year,
        social_sort: SocialSort | str = SocialSort.latest,
    ) -> DashboardResponse:
        normalized = TickerNormalizer.normalize(ticker)
        normalized_range = ChartRange(chart_range)
        normalized_sort = SocialSort(social_sort)
        sources = {}

        try:
            overview = self.overview_service.overview(normalized)
            sources["overview"] = self.status_builder.success(overview)
        except Exception as exc:
            overview = None
            sources["overview"] = self.status_builder.failure(exc)

        try:
            chart = self.chart_service.chart(normalized, normalized_range)
            sources["chart"] = self.status_builder.success(chart)
        except Exception as exc:
            chart = ChartResponse(ticker=normalized, range=normalized_range, points=[])
            sources["chart"] = self.status_builder.failure(exc)

        try:
            financials = self.financial_service.history(normalized)
            sources["financials"] = self.status_builder.success(financials)
        except Exception as exc:
            financials = FinancialHistoryResponse(ticker=normalized, summary=None, years=[])
            sources["financials"] = self.status_builder.failure(exc)

        try:
            social = self.social_service.posts(normalized, normalized_sort)
            sources["social"] = self.status_builder.success(social)
        except Exception as exc:
            social = SocialPostsResponse(ticker=normalized, sort=normalized_sort, items=[])
            sources["social"] = self.status_builder.failure(exc)

        return DashboardResponse(
            ticker=normalized,
            overview=overview,
            chart=chart,
            financials=financials,
            social=social,
            sources=sources,
        )
