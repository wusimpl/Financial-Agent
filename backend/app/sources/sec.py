from __future__ import annotations

import json
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.cache import FileCache
from app.core.config import Settings, get_settings
from app.sources.errors import SourceError


class SecFilingsSource:
    company_tickers_url = "https://www.sec.gov/files/company_tickers.json"
    submissions_url = "https://data.sec.gov/submissions/CIK{cik}.json"
    historical_submissions_url = "https://data.sec.gov/submissions/{file_name}"
    facts_url = "https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"
    archive_url = "https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/{document}"

    def __init__(self, settings: Settings | None = None, cache: FileCache | None = None) -> None:
        self.settings = settings or get_settings()
        self.cache = cache or FileCache(self.settings.cache_dir)

    def find_company(self, ticker: str) -> dict[str, Any]:
        normalized = self._normalize_ticker(ticker)
        for company in self.company_index():
            if company["ticker"] == normalized:
                return company
        raise SourceError(f"未找到美股代码：{normalized}")

    def company_index(self) -> list[dict[str, Any]]:
        return self._company_index()

    def list_filings(
        self,
        ticker: str,
        forms: Iterable[str] = ("10-K", "10-Q"),
        limit: int = 10,
        year: int | None = None,
        year_basis: str = "report",
    ) -> dict[str, Any]:
        company = self.find_company(ticker)
        wanted_forms = {form.upper() for form in forms}
        date_field = self._date_field(year_basis)
        items: list[dict[str, Any]] = []

        if limit <= 0:
            raise SourceError("财报数量必须大于 0")

        for filing in self._iter_filings(company, include_history=year is not None):
            if filing["form"].upper() not in wanted_forms:
                continue
            if year is not None and self._date_year(filing.get(date_field, "")) != year:
                continue

            items.append(filing)

            if len(items) >= limit:
                break

        return {"company": company, "items": items}

    def latest_filing(self, ticker: str, form: str = "10-K") -> dict[str, Any]:
        filings = self.list_filings(ticker, forms=(form,), limit=1)
        if not filings["items"]:
            raise SourceError(f"未找到 {ticker.upper()} 的 {form.upper()} 文件")
        return {"company": filings["company"], "filing": filings["items"][0]}

    def filing_by_year(
        self,
        ticker: str,
        year: int,
        form: str = "10-K",
        year_basis: str = "report",
    ) -> dict[str, Any]:
        filings = self.list_filings(ticker, forms=(form,), limit=1, year=year, year_basis=year_basis)
        if not filings["items"]:
            raise SourceError(f"未找到 {ticker.upper()} 在 {year} 年的 {form.upper()} 文件")
        return {"company": filings["company"], "filing": filings["items"][0]}

    def filing_document(self, ticker: str, accession_number: str, primary_document: str) -> dict[str, Any]:
        company = self.find_company(ticker)
        accession_path = accession_number.replace("-", "")
        url = self.archive_url.format(
            cik=company["cik"],
            accession=accession_path,
            document=primary_document,
        )
        cache_key = f"{ticker.upper()}:{accession_number}:{primary_document}"
        cached = self.cache.get_text("sec-documents", cache_key)
        if cached is None:
            cached = self._get_text(url)
            self.cache.set_text("sec-documents", cache_key, cached)
        return {"company": company, "url": url, "document": cached}

    def filing_document_by_year(
        self,
        ticker: str,
        year: int,
        form: str = "10-K",
        year_basis: str = "report",
    ) -> dict[str, Any]:
        result = self.filing_by_year(ticker, year, form=form, year_basis=year_basis)
        filing = result["filing"]
        document = self.filing_document(ticker, filing["accessionNumber"], filing["primaryDocument"])
        return {
            "company": result["company"],
            "filing": filing,
            "url": document["url"],
            "document": document["document"],
        }

    def company_facts(self, ticker: str) -> dict[str, Any]:
        company = self.find_company(ticker)
        url = self.facts_url.format(cik=company["cikPadded"])
        data = self._get_json("sec-facts", url, self.settings.sec_facts_cache_seconds)
        return {"company": company, "facts": data.get("facts", {})}

    def _company_index(self) -> list[dict[str, Any]]:
        raw = self._get_json("sec-company-index", self.company_tickers_url, self.settings.sec_index_cache_seconds)
        companies: list[dict[str, Any]] = []
        for item in raw.values():
            cik = str(item["cik_str"])
            companies.append(
                {
                    "ticker": item["ticker"].upper(),
                    "title": item["title"],
                    "cik": cik,
                    "cikPadded": cik.zfill(10),
                }
            )
        return companies

    def _submissions(self, company: dict[str, Any]) -> dict[str, Any]:
        url = self.submissions_url.format(cik=company["cikPadded"])
        return self._get_json("sec-submissions", url, self.settings.sec_submissions_cache_seconds)

    def _historical_submissions(self, file_name: str) -> dict[str, Any]:
        url = self.historical_submissions_url.format(file_name=file_name)
        return self._get_json("sec-submissions-history", url, self.settings.sec_submissions_cache_seconds)

    def _iter_filings(self, company: dict[str, Any], include_history: bool) -> Iterable[dict[str, Any]]:
        submissions = self._submissions(company)
        recent = submissions["filings"]["recent"]
        yield from self._filings_from_block(company, recent)

        if not include_history:
            return

        for file_info in submissions["filings"].get("files", []):
            file_name = file_info.get("name")
            if not file_name:
                continue
            yield from self._filings_from_block(company, self._historical_submissions(file_name))

    def _filings_from_block(self, company: dict[str, Any], block: dict[str, Any]) -> Iterable[dict[str, Any]]:
        for index, form in enumerate(block.get("form", [])):
            accession_number = self._array_value(block, "accessionNumber", index)
            primary_document = self._array_value(block, "primaryDocument", index)
            if not accession_number or not primary_document:
                continue

            accession_path = accession_number.replace("-", "")
            yield {
                "form": form,
                "filingDate": self._array_value(block, "filingDate", index),
                "reportDate": self._array_value(block, "reportDate", index),
                "accessionNumber": accession_number,
                "primaryDocument": primary_document,
                "primaryDocDescription": self._array_value(block, "primaryDocDescription", index),
                "documentUrl": self.archive_url.format(
                    cik=company["cik"],
                    accession=accession_path,
                    document=primary_document,
                ),
            }

    def _get_json(self, namespace: str, url: str, max_age_seconds: int) -> dict[str, Any]:
        cached = self.cache.get_json(namespace, url, max_age_seconds)
        if cached is not None:
            return cached

        text = self._get_text(url)
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            raise SourceError(f"SEC 返回内容不是有效 JSON：{url}") from exc

        self.cache.set_json(namespace, url, data)
        return data

    def _get_text(self, url: str) -> str:
        request = Request(
            url,
            headers={
                "User-Agent": self.settings.sec_user_agent,
                "Accept": "application/json,text/html;q=0.9,*/*;q=0.8",
            },
        )
        try:
            with urlopen(request, timeout=self.settings.request_timeout_seconds) as response:
                return response.read().decode("utf-8", errors="replace")
        except HTTPError as exc:
            raise SourceError(f"SEC 请求失败：HTTP {exc.code}") from exc
        except URLError as exc:
            raise SourceError(f"SEC 请求失败：{exc.reason}") from exc

    @staticmethod
    def _normalize_ticker(ticker: str) -> str:
        normalized = ticker.strip().upper()
        if not normalized:
            raise SourceError("股票代码不能为空")
        return normalized

    @staticmethod
    def _date_field(year_basis: str) -> str:
        normalized = year_basis.strip().lower()
        if normalized == "report":
            return "reportDate"
        if normalized == "filing":
            return "filingDate"
        raise SourceError("年份口径必须是 report 或 filing")

    @staticmethod
    def _date_year(value: str) -> int | None:
        if len(value) < 4:
            return None
        try:
            return int(value[:4])
        except ValueError:
            return None

    @staticmethod
    def _array_value(block: dict[str, Any], key: str, index: int) -> Any:
        values = block.get(key, [])
        if index >= len(values):
            return ""
        return values[index]
