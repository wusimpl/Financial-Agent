from __future__ import annotations


class TickerNormalizer:
    @staticmethod
    def normalize(ticker: str) -> str:
        normalized = ticker.strip().upper()
        if not normalized:
            raise ValueError("ticker is required")
        return normalized
