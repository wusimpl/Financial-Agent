from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.schemas import ChartPoint, ChartRange


@dataclass(frozen=True)
class ChartRequestParams:
    period: str
    count: int


class ChartRangeMapper:
    ranges: dict[ChartRange, ChartRequestParams] = {
        ChartRange.one_day: ChartRequestParams(period="1MIN", count=390),
        ChartRange.five_day: ChartRequestParams(period="5MIN", count=390),
        ChartRange.one_month: ChartRequestParams(period="DAILY", count=23),
        ChartRange.three_month: ChartRequestParams(period="DAILY", count=66),
        ChartRange.six_month: ChartRequestParams(period="DAILY", count=132),
        ChartRange.year_to_date: ChartRequestParams(period="DAILY", count=260),
        ChartRange.one_year: ChartRequestParams(period="DAILY", count=252),
        ChartRange.five_year: ChartRequestParams(period="DAILY", count=1000),
        ChartRange.all: ChartRequestParams(period="DAILY", count=1000),
    }

    def map(self, chart_range: ChartRange | str) -> ChartRequestParams:
        normalized = ChartRange(chart_range)
        return self.ranges[normalized]


class TechnicalIndicatorCalculator:
    def with_indicators(self, rows: list[dict[str, Any]]) -> list[ChartPoint]:
        closes = [self._number(row.get("close")) for row in rows]
        ma20 = self._moving_average(closes, 20)
        ma50 = self._moving_average(closes, 50)
        ma200 = self._moving_average(closes, 200)
        rsi14 = self._rsi(closes, 14)
        macd, signal, hist = self._macd(closes)

        points: list[ChartPoint] = []
        for index, row in enumerate(rows):
            points.append(
                ChartPoint(
                    date=str(row.get("datetime") or row.get("date") or ""),
                    open=self._number(row.get("open")),
                    high=self._number(row.get("high")),
                    low=self._number(row.get("low")),
                    close=closes[index],
                    volume=self._number(row.get("vol", row.get("volume"))),
                    ma20=ma20[index],
                    ma50=ma50[index],
                    ma200=ma200[index],
                    rsi14=rsi14[index],
                    macd=macd[index],
                    macd_signal=signal[index],
                    macd_hist=hist[index],
                )
            )
        return points

    def _moving_average(self, values: list[float | None], period: int) -> list[float | None]:
        averages: list[float | None] = []
        for index in range(len(values)):
            window = values[index - period + 1 : index + 1]
            if len(window) < period or any(value is None for value in window):
                averages.append(None)
                continue
            averages.append(self._round(sum(value for value in window if value is not None) / period))
        return averages

    def _rsi(self, closes: list[float | None], period: int) -> list[float | None]:
        result: list[float | None] = [None] * len(closes)
        if len(closes) <= period:
            return result

        gains: list[float] = []
        losses: list[float] = []
        for index in range(1, period + 1):
            previous = closes[index - 1]
            current = closes[index]
            if previous is None or current is None:
                return result
            change = current - previous
            gains.append(max(change, 0))
            losses.append(abs(min(change, 0)))

        average_gain = sum(gains) / period
        average_loss = sum(losses) / period
        result[period] = self._rsi_value(average_gain, average_loss)

        for index in range(period + 1, len(closes)):
            previous = closes[index - 1]
            current = closes[index]
            if previous is None or current is None:
                continue
            change = current - previous
            gain = max(change, 0)
            loss = abs(min(change, 0))
            average_gain = (average_gain * (period - 1) + gain) / period
            average_loss = (average_loss * (period - 1) + loss) / period
            result[index] = self._rsi_value(average_gain, average_loss)

        return result

    def _macd(self, closes: list[float | None]) -> tuple[list[float | None], list[float | None], list[float | None]]:
        ema12 = self._ema(closes, 12)
        ema26 = self._ema(closes, 26)
        macd = [
            self._round(short - long) if short is not None and long is not None else None
            for short, long in zip(ema12, ema26)
        ]
        signal = self._ema(macd, 9)
        hist = [
            self._round(value - signal_value) if value is not None and signal_value is not None else None
            for value, signal_value in zip(macd, signal)
        ]
        return macd, signal, hist

    def _ema(self, values: list[float | None], period: int) -> list[float | None]:
        result: list[float | None] = [None] * len(values)
        multiplier = 2 / (period + 1)
        ema_value: float | None = None

        for index, value in enumerate(values):
            if value is None:
                continue
            if ema_value is None:
                window = [item for item in values[index - period + 1 : index + 1] if item is not None]
                if len(window) < period:
                    continue
                ema_value = sum(window) / period
            else:
                ema_value = (value - ema_value) * multiplier + ema_value
            result[index] = self._round(ema_value)
        return result

    @staticmethod
    def _rsi_value(average_gain: float, average_loss: float) -> float:
        if average_loss == 0:
            return 100.0
        rs = average_gain / average_loss
        return TechnicalIndicatorCalculator._round(100 - (100 / (1 + rs)))

    @staticmethod
    def _number(value: Any) -> float | None:
        if value is None or value == "":
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _round(value: float) -> float:
        return round(value, 6)
