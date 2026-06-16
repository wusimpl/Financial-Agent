from __future__ import annotations

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.schemas import MarketStatus, MarketStatusValue


class MarketStatusResolver:
    exchange_timezone = ZoneInfo("America/New_York")

    def resolve(self, checked_at: datetime | None = None) -> MarketStatus:
        now = checked_at or datetime.now(tz=self.exchange_timezone)
        if now.tzinfo is None:
            now = now.replace(tzinfo=self.exchange_timezone)
        local_now = now.astimezone(self.exchange_timezone)

        if self._is_market_holiday(local_now.date()) or local_now.weekday() >= 5:
            value = MarketStatusValue.closed
            label = "Closed"
        elif time(4, 0) <= local_now.time() < time(9, 30):
            value = MarketStatusValue.pre_market
            label = "Pre-market"
        elif time(9, 30) <= local_now.time() < time(16, 0):
            value = MarketStatusValue.open
            label = "Open"
        elif time(16, 0) <= local_now.time() < time(20, 0):
            value = MarketStatusValue.after_hours
            label = "After hours"
        else:
            value = MarketStatusValue.overnight
            label = "Overnight"

        return MarketStatus(
            status=value,
            label=label,
            is_open=value == MarketStatusValue.open,
            checked_at=local_now.isoformat(),
        )

    def _is_market_holiday(self, day: date) -> bool:
        holidays = {
            self._observed(date(day.year, 1, 1)),
            self._nth_weekday(day.year, 1, 0, 3),
            self._nth_weekday(day.year, 2, 0, 3),
            self._good_friday(day.year),
            self._last_weekday(day.year, 5, 0),
            self._observed(date(day.year, 6, 19)),
            self._observed(date(day.year, 7, 4)),
            self._nth_weekday(day.year, 9, 0, 1),
            self._nth_weekday(day.year, 11, 3, 4),
            self._observed(date(day.year, 12, 25)),
        }
        return day in holidays

    @staticmethod
    def _observed(day: date) -> date:
        if day.weekday() == 5:
            return day - timedelta(days=1)
        if day.weekday() == 6:
            return day + timedelta(days=1)
        return day

    @staticmethod
    def _nth_weekday(year: int, month: int, weekday: int, occurrence: int) -> date:
        current = date(year, month, 1)
        offset = (weekday - current.weekday()) % 7
        return current + timedelta(days=offset + 7 * (occurrence - 1))

    @staticmethod
    def _last_weekday(year: int, month: int, weekday: int) -> date:
        current = date(year, month + 1, 1) - timedelta(days=1) if month < 12 else date(year, 12, 31)
        offset = (current.weekday() - weekday) % 7
        return current - timedelta(days=offset)

    @staticmethod
    def _good_friday(year: int) -> date:
        a = year % 19
        b = year // 100
        c = year % 100
        d = b // 4
        e = b % 4
        f = (b + 8) // 25
        g = (b - f + 1) // 3
        h = (19 * a + b - d - g + 15) % 30
        i = c // 4
        k = c % 4
        l = (32 + 2 * e + 2 * i - h - k) % 7
        m = (a + 11 * h + 22 * l) // 451
        month = (h + l - 7 * m + 114) // 31
        day = ((h + l - 7 * m + 114) % 31) + 1
        return date(year, month, day) - timedelta(days=2)
