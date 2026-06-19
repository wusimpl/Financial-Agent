from __future__ import annotations

import html
import re
from typing import Any

from app.logic.sec import SecDocumentParser, SecMetadataMapper, SecSectionExtractor
from app.logic.tickers import TickerNormalizer
from app.schemas import FilingDocumentResponse, FilingSummary
from app.sources.sec import SecFilingsSource


class SecFilingService:
    default_forms = ("10-K", "10-Q", "8-K")

    def __init__(
        self,
        sec_source: SecFilingsSource | None = None,
        document_parser: SecDocumentParser | None = None,
        section_extractor: SecSectionExtractor | None = None,
        metadata_mapper: SecMetadataMapper | None = None,
    ) -> None:
        self.sec_source = sec_source or SecFilingsSource()
        self.document_parser = document_parser or SecDocumentParser()
        self.section_extractor = section_extractor or SecSectionExtractor()
        self.metadata_mapper = metadata_mapper or SecMetadataMapper()

    def filings(
        self,
        ticker: str,
        year: int | None = None,
        filing_type: str | None = None,
        limit: int = 20,
        year_basis: str = "report",
    ) -> list[FilingSummary]:
        normalized = TickerNormalizer.normalize(ticker)
        forms = (filing_type.upper(),) if filing_type else self.default_forms
        raw = self.sec_source.list_filings(normalized, forms=forms, limit=limit, year=year, year_basis=year_basis)
        return [self._summary(normalized, filing) for filing in raw["items"]]

    def document(
        self,
        ticker: str,
        accession_number: str,
        primary_document: str,
    ) -> FilingDocumentResponse:
        normalized = TickerNormalizer.normalize(ticker)
        raw = self.sec_source.filing_document(normalized, accession_number, primary_document)
        filing = self._find_filing(normalized, accession_number) or {
            "accessionNumber": accession_number,
            "primaryDocument": primary_document,
            "form": "",
        }
        return self._document_response(normalized, raw["company"], filing, raw["document"])

    def document_by_year(
        self,
        ticker: str,
        year: int,
        filing_type: str = "10-K",
        year_basis: str = "report",
    ) -> FilingDocumentResponse:
        normalized = TickerNormalizer.normalize(ticker)
        result = self.sec_source.filing_by_year(normalized, year=year, form=filing_type, year_basis=year_basis)
        filing = result["filing"]
        raw = self.sec_source.filing_document(normalized, filing["accessionNumber"], filing["primaryDocument"])
        return self._document_response(normalized, result["company"], filing, raw["document"])

    def document_html_by_year(
        self,
        ticker: str,
        year: int,
        filing_type: str = "10-K",
        year_basis: str = "report",
        theme: str | None = None,
    ) -> str:
        normalized = TickerNormalizer.normalize(ticker)
        raw = self.sec_source.filing_document_by_year(normalized, year=year, form=filing_type, year_basis=year_basis)
        return self._document_with_base(raw["document"], raw["url"], dark=theme == "dark")

    def _document_response(
        self,
        ticker: str,
        company: dict[str, Any],
        filing: dict[str, Any],
        document: str,
    ) -> FilingDocumentResponse:
        text = self.document_parser.parse(document)
        submissions = self.sec_source.company_submissions(company)
        return FilingDocumentResponse(
            ticker=ticker,
            metadata=self.metadata_mapper.map(company, filing, submissions=submissions),
            document=text,
            sections=self.section_extractor.extract(text),
        )

    def _find_filing(self, ticker: str, accession_number: str) -> dict[str, Any] | None:
        raw = self.sec_source.list_filings(ticker, forms=self.default_forms, limit=100)
        for filing in raw["items"]:
            if filing.get("accessionNumber") == accession_number:
                return filing
        return None

    @staticmethod
    def _summary(ticker: str, filing: dict[str, Any]) -> FilingSummary:
        return FilingSummary(
            ticker=ticker,
            form_type=str(filing.get("form") or ""),
            filing_date=filing.get("filingDate"),
            report_date=filing.get("reportDate"),
            accession_number=str(filing.get("accessionNumber") or ""),
            primary_document=str(filing.get("primaryDocument") or ""),
            document_url=filing.get("documentUrl"),
        )

    @staticmethod
    def _document_with_base(document: str, url: str, dark: bool = False) -> str:
        base = f'<base href="{html.escape(url, quote=True)}">'
        anchor_script = """
<script id="financial-agent-sec-anchor-navigation">
(function () {
  function fragmentFromHref(href) {
    if (!href || href.charAt(0) !== "#") return "";
    return href.slice(1);
  }

  function findTarget(fragment) {
    if (!fragment) return null;

    var decoded = fragment;
    try {
      decoded = decodeURIComponent(fragment);
    } catch (error) {
      decoded = fragment;
    }

    return document.getElementById(decoded) ||
      document.getElementsByName(decoded)[0] ||
      document.getElementById(fragment) ||
      document.getElementsByName(fragment)[0];
  }

  document.addEventListener("click", function (event) {
    var clicked = event.target;
    if (!clicked || !clicked.closest) return;

    var link = clicked.closest("a[href]");
    if (!link) return;

    var fragment = fragmentFromHref(link.getAttribute("href"));
    var target = findTarget(fragment);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ block: "start" });
    history.replaceState(null, "", "#" + fragment);
  });
})();
</script>
""".strip()
        dark_style = """
<style id="financial-agent-sec-dark-mode">
:root {
  color-scheme: dark;
}
html,
body {
  background: #0B0E14 !important;
  color: #CBD5E1 !important;
}
body * {
  background-color: transparent !important;
  color: #CBD5E1 !important;
  border-color: #30363D !important;
}
table,
thead,
tbody,
tfoot,
tr,
td,
th {
  background-color: #0F141C !important;
  border-color: #30363D !important;
}
a,
a * {
  color: #93C5FD !important;
}
hr {
  border-color: #30363D !important;
}
input,
textarea,
select,
button {
  background-color: #111827 !important;
  color: #E5E7EB !important;
  border-color: #374151 !important;
}
img,
picture,
video,
canvas,
svg {
  filter: brightness(0.92) contrast(1.05);
}
</style>
""".strip()
        injections = f"{base}{anchor_script}" if not dark else f"{base}{anchor_script}{dark_style}"
        if re.search(r"<head[\s>]", document, flags=re.IGNORECASE):
            return re.sub(r"(<head[^>]*>)", lambda match: f"{match.group(1)}{injections}", document, count=1, flags=re.IGNORECASE)
        return f"{injections}{document}"
