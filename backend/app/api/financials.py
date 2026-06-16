from __future__ import annotations

from fastapi import APIRouter

from app.schemas import FinancialHistoryResponse, FinancialSummary
from app.services.financials import FinancialDataService

router = APIRouter(prefix="/financials", tags=["financials"])

financial_service = FinancialDataService()


@router.get("/{ticker}/summary", response_model=FinancialSummary)
def financial_summary(ticker: str) -> FinancialSummary:
    return financial_service.summary(ticker)


@router.get("/{ticker}/history", response_model=FinancialHistoryResponse)
def financial_history(ticker: str) -> FinancialHistoryResponse:
    return financial_service.history(ticker)
