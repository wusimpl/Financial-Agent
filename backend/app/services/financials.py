from __future__ import annotations

from app.logic.financials import FinancialFactsMapper
from app.logic.tickers import TickerNormalizer
from app.schemas import FinancialHistoryResponse, FinancialSummary
from app.sources.sec import SecFilingsSource


class FinancialDataService:
    def __init__(
        self,
        sec_source: SecFilingsSource | None = None,
        facts_mapper: FinancialFactsMapper | None = None,
    ) -> None:
        self.sec_source = sec_source or SecFilingsSource()
        self.facts_mapper = facts_mapper or FinancialFactsMapper()

    def history(self, ticker: str) -> FinancialHistoryResponse:
        normalized = TickerNormalizer.normalize(ticker)
        raw = self.sec_source.company_facts(normalized)
        years = self.facts_mapper.history(raw["facts"], normalized)
        summary = self.facts_mapper.summary(raw["facts"], normalized)
        return FinancialHistoryResponse(ticker=normalized, summary=summary, years=years)

    def summary(self, ticker: str) -> FinancialSummary:
        normalized = TickerNormalizer.normalize(ticker)
        raw = self.sec_source.company_facts(normalized)
        return self.facts_mapper.summary(raw["facts"], normalized)
