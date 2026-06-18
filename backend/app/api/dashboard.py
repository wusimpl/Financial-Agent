from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas import ChartRange, DashboardResponse, SocialLanguage, SocialMinFaves, SocialSort
from app.services.dashboard import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

dashboard_service = DashboardService()


@router.get("/{ticker}", response_model=DashboardResponse)
def dashboard(
    ticker: str,
    chart_range: ChartRange = Query(ChartRange.one_year, alias="range"),
    social_sort: SocialSort = Query(SocialSort.hot),
    social_language: SocialLanguage = Query(SocialLanguage.zh),
    social_min_faves: SocialMinFaves = Query(SocialMinFaves.thirty),
) -> DashboardResponse:
    return dashboard_service.dashboard(
        ticker,
        chart_range=chart_range,
        social_sort=social_sort,
        social_language=social_language,
        social_min_faves=social_min_faves,
    )
