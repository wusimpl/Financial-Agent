from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any

from app.core.cache import FileCache
from app.core.config import Settings, get_settings
from app.sources.errors import SourceError


class MarketSource:
    periods = {"DAILY", "5MIN", "15MIN", "30MIN", "60MIN", "1MIN"}
    adjusts = {"NONE", "QFQ", "HFQ"}

    def __init__(self, settings: Settings | None = None, cache: FileCache | None = None) -> None:
        self.settings = settings or get_settings()
        self.cache = cache or FileCache(self.settings.cache_dir)

    def us_kline(
        self,
        ticker: str,
        count: int = 120,
        period: str = "DAILY",
        adjust: str = "NONE",
    ) -> dict[str, Any]:
        normalized = self._normalize_ticker(ticker)
        normalized_period = period.upper()
        normalized_adjust = adjust.upper()

        if normalized_period not in self.periods:
            raise SourceError(f"不支持的 K 线周期：{period}")
        if normalized_adjust not in self.adjusts:
            raise SourceError(f"不支持的复权方式：{adjust}")
        if count <= 0 or count > 1000:
            raise SourceError("K 线数量必须在 1 到 1000 之间")

        cache_key = f"us-kline:{normalized}:{normalized_period}:{normalized_adjust}:{count}"
        cached = self.cache.get_json("market", cache_key, self.settings.market_cache_seconds)
        if cached is not None:
            return cached

        rows = self._run_easy_tdx(
            [
                "ex",
                "kline",
                "US_STOCK",
                normalized,
                "--count",
                str(count),
                "--period",
                normalized_period,
                "--adjust",
                normalized_adjust,
            ]
        )
        result = {"ticker": normalized, "period": normalized_period, "adjust": normalized_adjust, "items": self._compact_kline(rows)}
        self.cache.set_json("market", cache_key, result)
        return result

    def _run_easy_tdx(self, args: list[str]) -> Any:
        exe = shutil.which("easy-tdx")
        if not exe:
            raise SourceError("未找到 easy-tdx")

        Path.home().joinpath(".easy_tdx").mkdir(parents=True, exist_ok=True)
        proc = subprocess.run(
            [exe, *args],
            text=True,
            capture_output=True,
            timeout=self.settings.request_timeout_seconds,
            env=os.environ.copy(),
        )
        if proc.returncode != 0:
            message = (proc.stderr or proc.stdout).strip()
            raise SourceError(f"easy-tdx 执行失败：{message}")

        try:
            return json.loads(proc.stdout)
        except json.JSONDecodeError as exc:
            raise SourceError("easy-tdx 返回内容不是有效 JSON") from exc

    @staticmethod
    def _compact_kline(rows: Any) -> list[dict[str, Any]]:
        if not isinstance(rows, list):
            raise SourceError("K 线返回格式不符合预期")

        keys = ["datetime", "open", "high", "low", "close", "vol", "amount"]
        return [{key: row.get(key) for key in keys if key in row} for row in rows if isinstance(row, dict)]

    @staticmethod
    def _normalize_ticker(ticker: str) -> str:
        normalized = ticker.strip().upper()
        if not normalized:
            raise SourceError("股票代码不能为空")
        return normalized
