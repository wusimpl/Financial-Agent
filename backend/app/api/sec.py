from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas import FilingDocumentResponse, FilingSummary
from app.services.sec import SecFilingService

router = APIRouter(prefix="/sec", tags=["sec"])

sec_service = SecFilingService()


@router.get("/{ticker}/filings", response_model=list[FilingSummary])
def filings(
    ticker: str,
    year: int | None = Query(None, ge=1900, le=2100),
    filing_type: str | None = Query(None, alias="type"),
    limit: int = Query(20, ge=1, le=100),
    year_basis: str = Query("report"),
) -> list[FilingSummary]:
    return sec_service.filings(ticker, year=year, filing_type=filing_type, limit=limit, year_basis=year_basis)


@router.get("/{ticker}/document", response_model=FilingDocumentResponse)
def document(
    ticker: str,
    accession_number: str,
    primary_document: str,
) -> FilingDocumentResponse:
    return sec_service.document(ticker, accession_number, primary_document)


@router.get("/{ticker}/document-by-year", response_model=FilingDocumentResponse)
def document_by_year(
    ticker: str,
    year: int = Query(..., ge=1900, le=2100),
    filing_type: str = Query("10-K", alias="type"),
    year_basis: str = Query("report"),
) -> FilingDocumentResponse:
    return sec_service.document_by_year(ticker, year=year, filing_type=filing_type, year_basis=year_basis)
