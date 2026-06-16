from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas import ChartRange, ChartResponse
from app.services.charts import ChartDataService

router = APIRouter(prefix="/charts", tags=["charts"])

chart_service = ChartDataService()


@router.get("/{ticker}", response_model=ChartResponse)
def chart(
    ticker: str,
    chart_range: ChartRange = Query(ChartRange.one_year, alias="range"),
) -> ChartResponse:
    return chart_service.chart(ticker, chart_range)
