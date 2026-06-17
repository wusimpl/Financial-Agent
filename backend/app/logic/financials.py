from __future__ import annotations

from collections import defaultdict
from typing import Any

from app.schemas import FinancialSummary, FinancialYear


class FinancialFactsMapper:
    field_tags: dict[str, tuple[str, ...]] = {
        "revenue": (
            "RevenueFromContractWithCustomerExcludingAssessedTax",
            "Revenues",
            "SalesRevenueNet",
            "NetSales",
        ),
        "cost": (
            "CostOfRevenue",
            "CostOfGoodsAndServicesSold",
            "CostOfGoodsSold",
        ),
        "gross_profit": ("GrossProfit",),
        "operating_profit": ("OperatingIncomeLoss",),
        "net_income": ("NetIncomeLoss",),
        "eps": ("EarningsPerShareDiluted", "EarningsPerShareBasicAndDiluted"),
    }

    def history(self, facts: dict[str, Any], ticker: str) -> list[FinancialYear]:
        annual_values: dict[int, dict[str, Any]] = defaultdict(dict)
        for field, tags in self.field_tags.items():
            for tag in tags:
                for item in self._annual_items(facts, tag):
                    year = self._period_year(item)
                    if year is None:
                        continue
                    current = annual_values[year].get(field)
                    if current is None or str(item.get("filed", "")) > str(current.get("filed", "")):
                        annual_values[year][field] = item
                if any(field in values for values in annual_values.values()):
                    break

        years: list[FinancialYear] = []
        for year in sorted(annual_values.keys(), reverse=True):
            values = annual_values[year]
            years.append(
                FinancialYear(
                    year=year,
                    year_end=self._item_end(values),
                    revenue=self._value(values.get("revenue")),
                    cost=self._value(values.get("cost")),
                    gross_profit=self._value(values.get("gross_profit")),
                    operating_profit=self._value(values.get("operating_profit")),
                    net_income=self._value(values.get("net_income")),
                    eps=self._value(values.get("eps")),
                )
            )
        return years

    def summary(self, facts: dict[str, Any], ticker: str) -> FinancialSummary:
        history = self.history(facts, ticker)
        latest = history[0] if history else None
        return FinancialSummary(
            ticker=ticker,
            period_end=latest.year_end if latest else None,
            net_sales=latest.revenue if latest else None,
            cost_of_sales=latest.cost if latest else None,
            gross_profit=latest.gross_profit if latest else None,
        )

    def _annual_items(self, facts: dict[str, Any], tag: str) -> list[dict[str, Any]]:
        payload = facts.get("us-gaap", {}).get(tag, {})
        units = payload.get("units", {})
        rows: list[dict[str, Any]] = []
        for unit_rows in units.values():
            if not isinstance(unit_rows, list):
                continue
            for item in unit_rows:
                if item.get("form") == "10-K" and item.get("fp") == "FY" and "val" in item:
                    rows.append(item)
        return rows

    @staticmethod
    def _fiscal_year(item: dict[str, Any]) -> int | None:
        fy = item.get("fy")
        if isinstance(fy, int):
            return fy
        end = item.get("end")
        if isinstance(end, str) and len(end) >= 4:
            try:
                return int(end[:4])
            except ValueError:
                return None
        return None

    @staticmethod
    def _item_end(values: dict[str, dict[str, Any]]) -> str | None:
        for item in values.values():
            end = item.get("end")
            if end:
                return str(end)
        return None

    @staticmethod
    def _value(item: dict[str, Any] | None) -> float | None:
        if item is None:
            return None
        value = item.get("val")
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _period_year(item: dict[str, Any]) -> int | None:
        frame = item.get("frame")
        if isinstance(frame, str):
            match = frame.removeprefix("CY")
            if len(match) >= 4 and match[:4].isdigit():
                return int(match[:4])

        end = item.get("end")
        if isinstance(end, str) and len(end) >= 4:
            try:
                return int(end[:4])
            except ValueError:
                return None

        return FinancialFactsMapper._fiscal_year(item)


class FinancialMetricCalculator:
    @staticmethod
    def gross_margin(revenue: float | None, gross_profit: float | None) -> float | None:
        if revenue in (None, 0) or gross_profit is None:
            return None
        return round(gross_profit / revenue, 6)

    @staticmethod
    def revenue_growth(current: float | None, previous: float | None) -> float | None:
        if current is None or previous in (None, 0):
            return None
        return round((current - previous) / previous, 6)
