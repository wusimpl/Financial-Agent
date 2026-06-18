from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas import StockOverviewResponse, StockSearchItem, WatchlistItem
from app.services.stocks import StockOverviewService, StockSearchService, WatchlistService

router = APIRouter(prefix="/stocks", tags=["stocks"])

search_service = StockSearchService()
watchlist_service = WatchlistService()
overview_service = StockOverviewService()


@router.get("/search", response_model=list[StockSearchItem])
def search_stocks(
    query: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
) -> list[StockSearchItem]:
    return search_service.search(query, limit=limit)


@router.get("/watchlist", response_model=list[WatchlistItem])
def watchlist() -> list[WatchlistItem]:
    return watchlist_service.list_items()


@router.post("/watchlist/{ticker}", response_model=list[WatchlistItem])
def add_watchlist_item(ticker: str) -> list[WatchlistItem]:
    return watchlist_service.add_item(ticker)


@router.delete("/watchlist/{ticker}", response_model=list[WatchlistItem])
def remove_watchlist_item(ticker: str) -> list[WatchlistItem]:
    return watchlist_service.remove_item(ticker)


@router.get("/{ticker}/overview", response_model=StockOverviewResponse)
def stock_overview(ticker: str) -> StockOverviewResponse:
    return overview_service.overview(ticker)
