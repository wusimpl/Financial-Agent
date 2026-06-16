from __future__ import annotations

import json
from http.cookiejar import CookieJar
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import HTTPCookieProcessor, Request, build_opener

from app.core.cache import FileCache
from app.core.config import Settings, get_settings
from app.logic.tickers import TickerNormalizer
from app.sources.errors import SourceError
from app.sources.sec import SecFilingsSource


class StockDirectorySource:
    def __init__(self, sec_source: SecFilingsSource | None = None) -> None:
        self.sec_source = sec_source or SecFilingsSource()

    def search(self, query: str, limit: int = 10) -> dict[str, Any]:
        normalized = query.strip()
        if not normalized:
            raise SourceError("股票搜索关键词不能为空")
        if limit <= 0 or limit > 50:
            raise SourceError("股票搜索数量必须在 1 到 50 之间")

        upper_query = normalized.upper()
        lower_query = normalized.lower()
        matches: list[dict[str, Any]] = []
        for company in self.sec_source.company_index():
            ticker = str(company.get("ticker", "")).upper()
            title = str(company.get("title", ""))
            if ticker.startswith(upper_query) or lower_query in title.lower():
                matches.append(company)
            if len(matches) >= limit:
                break
        return {"query": normalized, "items": matches}

    def find(self, ticker: str) -> dict[str, Any]:
        return self.sec_source.find_company(TickerNormalizer.normalize(ticker))


class MarketProfileSource:
    crumb_url = "https://query1.finance.yahoo.com/v1/test/getcrumb"
    cookie_url = "https://fc.yahoo.com"
    quote_summary_url = (
        "https://query2.finance.yahoo.com/v10/finance/quoteSummary/{ticker}"
        "?modules=price,summaryDetail,defaultKeyStatistics,calendarEvents&crumb={crumb}"
    )

    def __init__(self, settings: Settings | None = None, cache: FileCache | None = None) -> None:
        self.settings = settings or get_settings()
        self.cache = cache or FileCache(self.settings.cache_dir)
        self._cookie_jar = CookieJar()
        self._opener = build_opener(HTTPCookieProcessor(self._cookie_jar))
        self._crumb: str | None = None

    def quote(self, ticker: str) -> dict[str, Any]:
        normalized = TickerNormalizer.normalize(ticker)
        cache_key = f"yahoo-quote-summary:{normalized}"
        cached = self.cache.get_json("market-profile", cache_key, self.settings.market_cache_seconds)
        if cached is not None:
            return cached

        url = self.quote_summary_url.format(ticker=quote(normalized), crumb=quote(self._get_crumb()))
        payload = self._get_json(url)
        result = payload.get("quoteSummary", {}).get("result", [])
        if not isinstance(result, list) or not result:
            raise SourceError(f"未找到行情资料：{normalized}")
        data = {"ticker": normalized, "profile": result[0]}
        self.cache.set_json("market-profile", cache_key, data)
        return data

    def quotes(self, tickers: list[str]) -> dict[str, Any]:
        normalized = [TickerNormalizer.normalize(ticker) for ticker in tickers]
        if not normalized:
            raise SourceError("股票代码不能为空")
        return {"tickers": normalized, "items": [self.quote(ticker)["profile"] for ticker in normalized]}

    def _get_crumb(self) -> str:
        if self._crumb:
            return self._crumb

        try:
            self._opener.open(self._request(self.cookie_url), timeout=self.settings.request_timeout_seconds)
        except HTTPError:
            pass
        except URLError as exc:
            raise SourceError(f"行情资料会话初始化失败：{exc.reason}") from exc

        try:
            with self._opener.open(self._request(self.crumb_url), timeout=self.settings.request_timeout_seconds) as response:
                crumb = response.read().decode("utf-8", errors="replace").strip()
        except HTTPError as exc:
            raise SourceError(f"行情资料授权请求失败：HTTP {exc.code}") from exc
        except URLError as exc:
            raise SourceError(f"行情资料授权请求失败：{exc.reason}") from exc

        if not crumb:
            raise SourceError("行情资料授权信息为空")
        self._crumb = crumb
        return crumb

    def _get_json(self, url: str) -> dict[str, Any]:
        try:
            with self._opener.open(self._request(url), timeout=self.settings.request_timeout_seconds) as response:
                text = response.read().decode("utf-8", errors="replace")
        except HTTPError as exc:
            raise SourceError(f"行情资料请求失败：HTTP {exc.code}") from exc
        except URLError as exc:
            raise SourceError(f"行情资料请求失败：{exc.reason}") from exc

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise SourceError("行情资料返回内容不是有效 JSON") from exc

    @staticmethod
    def _request(url: str) -> Request:
        return Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json,text/plain,*/*",
            },
        )
