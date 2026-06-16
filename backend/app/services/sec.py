from __future__ import annotations

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
