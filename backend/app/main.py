from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse

from app.api import charts, dashboard, financials, sec, social, stocks
from app.errors import AppError
from app.schemas import ApiErrorResponse
from app.sources.errors import SourceError
from app.sources.market import MarketSource
from app.sources.sec import SecFilingsSource
from app.sources.twitter import TwitterSource

app = FastAPI(title="Financial Agent Backend")
app.include_router(stocks.router)
app.include_router(charts.router)
app.include_router(sec.router)
app.include_router(financials.router)
app.include_router(social.router)
app.include_router(dashboard.router)

sec_source = SecFilingsSource()
market_source = MarketSource()
twitter_source = TwitterSource()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.response().model_dump())


@app.exception_handler(SourceError)
async def source_error_handler(request: Request, exc: SourceError) -> JSONResponse:
    response = ApiErrorResponse(error="source_error", message=str(exc))
    return JSONResponse(status_code=502, content=response.model_dump())


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    response = ApiErrorResponse(error="bad_request", message=str(exc))
    return JSONResponse(status_code=400, content=response.model_dump())


@app.get("/sources/sec/{ticker}/company")
def sec_company(ticker: str) -> dict:
    return _call_source(lambda: sec_source.find_company(ticker))


@app.get("/sources/sec/{ticker}/filings")
def sec_filings(
    ticker: str,
    forms: str = Query("10-K,10-Q", description="逗号分隔，例如 10-K,10-Q"),
    limit: int = Query(10, ge=1, le=50),
    year: int | None = Query(None, ge=1900, le=2100),
    year_basis: str = Query("report", description="report=报告期年份，filing=提交年份"),
) -> dict:
    parsed_forms = [item.strip().upper() for item in forms.split(",") if item.strip()]
    return _call_source(
        lambda: sec_source.list_filings(
            ticker,
            forms=parsed_forms,
            limit=limit,
            year=year,
            year_basis=year_basis,
        )
    )


@app.get("/sources/sec/{ticker}/latest-filing")
def sec_latest_filing(ticker: str, form: str = Query("10-K")) -> dict:
    return _call_source(lambda: sec_source.latest_filing(ticker, form=form))


@app.get("/sources/sec/{ticker}/filing-by-year")
def sec_filing_by_year(
    ticker: str,
    year: int = Query(..., ge=1900, le=2100),
    form: str = Query("10-K"),
    year_basis: str = Query("report", description="report=报告期年份，filing=提交年份"),
) -> dict:
    return _call_source(lambda: sec_source.filing_by_year(ticker, year=year, form=form, year_basis=year_basis))


@app.get("/sources/sec/{ticker}/filing-document")
def sec_filing_document(ticker: str, accession_number: str, primary_document: str) -> dict:
    return _call_source(lambda: sec_source.filing_document(ticker, accession_number, primary_document))


@app.get("/sources/sec/{ticker}/filing-document-by-year")
def sec_filing_document_by_year(
    ticker: str,
    year: int = Query(..., ge=1900, le=2100),
    form: str = Query("10-K"),
    year_basis: str = Query("report", description="report=报告期年份，filing=提交年份"),
) -> dict:
    return _call_source(lambda: sec_source.filing_document_by_year(ticker, year=year, form=form, year_basis=year_basis))


@app.get("/sources/sec/{ticker}/facts")
def sec_facts(ticker: str) -> dict:
    return _call_source(lambda: sec_source.company_facts(ticker))


@app.get("/sources/market/us/{ticker}/kline")
def us_kline(
    ticker: str,
    count: int = Query(120, ge=1, le=1000),
    period: str = Query("DAILY"),
    adjust: str = Query("NONE"),
) -> dict:
    return _call_source(lambda: market_source.us_kline(ticker, count=count, period=period, adjust=adjust))


@app.get("/sources/twitter/search")
def twitter_search(
    query: str,
    max_results: int = Query(20, ge=1, le=100),
    product: str = Query("Latest"),
) -> dict:
    return _call_source(lambda: twitter_source.search(query, max_results=max_results, product=product))


@app.get("/sources/twitter/user-posts/{username}")
def twitter_user_posts(username: str, max_results: int = Query(20, ge=1, le=100)) -> dict:
    return _call_source(lambda: twitter_source.user_posts(username, max_results=max_results))


def _call_source(action):
    try:
        return action()
    except SourceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
