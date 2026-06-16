from __future__ import annotations

import json
from pathlib import Path

from app.core.config import Settings, get_settings
from app.logic.tickers import TickerNormalizer


class WatchlistStore:
    def __init__(self, settings: Settings | None = None, path: Path | None = None) -> None:
        self.settings = settings or get_settings()
        self.path = path or self.settings.watchlist_path

    def list_tickers(self) -> list[str]:
        if not self.path.exists():
            return list(self.settings.default_watchlist)

        try:
            payload = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return list(self.settings.default_watchlist)

        tickers = payload.get("tickers") if isinstance(payload, dict) else payload
        if not isinstance(tickers, list):
            return list(self.settings.default_watchlist)
        return self._stable_unique(tickers)

    def save_tickers(self, tickers: list[str]) -> None:
        normalized = self._stable_unique(tickers)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps({"tickers": normalized}, ensure_ascii=False), encoding="utf-8")

    @staticmethod
    def _stable_unique(tickers: list[str]) -> list[str]:
        result: list[str] = []
        seen: set[str] = set()
        for ticker in tickers:
            normalized = TickerNormalizer.normalize(str(ticker))
            if normalized in seen:
                continue
            seen.add(normalized)
            result.append(normalized)
        return result
