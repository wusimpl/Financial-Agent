from datetime import datetime
from zoneinfo import ZoneInfo

from app.logic import (
    ChartRangeMapper,
    FinancialFactsMapper,
    MarketStatusResolver,
    SecDocumentParser,
    SecSectionExtractor,
    SocialPostNormalizer,
    TechnicalIndicatorCalculator,
    TickerNormalizer,
)
from app.schemas import ChartRange, MarketStatusValue


def test_ticker_normalizer_trims_and_uppercases():
    assert TickerNormalizer.normalize(" aapl ") == "AAPL"


def test_market_status_resolver_identifies_open_market():
    checked_at = datetime(2026, 6, 16, 10, 0, tzinfo=ZoneInfo("America/New_York"))

    status = MarketStatusResolver().resolve(checked_at)

    assert status.status == MarketStatusValue.open
    assert status.is_open is True


def test_chart_range_mapper_maps_frontend_range_to_source_params():
    params = ChartRangeMapper().map(ChartRange.one_day)

    assert params.period == "1MIN"
    assert params.count == 390


def test_technical_indicator_calculator_adds_ma_rsi_and_macd_fields():
    rows = [
        {"datetime": f"2026-01-{index + 1:02d}", "open": index, "high": index + 1, "low": index - 1, "close": index + 10, "vol": 1000 + index}
        for index in range(40)
    ]

    points = TechnicalIndicatorCalculator().with_indicators(rows)

    assert points[19].ma20 == 19.5
    assert points[39].rsi14 == 100.0
    assert points[39].macd is not None
    assert points[39].macd_signal is not None
    assert points[39].macd_hist is not None


def test_sec_document_parser_and_section_extractor():
    document = """
    <html><body><h1>Item 1. Business</h1><p>We build products.</p>
    <h1>Item 1A. Risk Factors</h1><p>Demand may change.</p>
    <h1>Item 7. Management’s Discussion and Analysis</h1><p>Revenue increased.</p></body></html>
    """

    text = SecDocumentParser().parse(document)
    sections = SecSectionExtractor().extract(text)

    assert "We build products." in text
    assert [section.name for section in sections] == ["business", "risk_factors", "management_discussion"]


def test_financial_facts_mapper_extracts_annual_history_and_summary():
    facts = {
        "us-gaap": {
            "RevenueFromContractWithCustomerExcludingAssessedTax": {
                "units": {"USD": [{"form": "10-K", "fp": "FY", "fy": 2025, "end": "2025-09-30", "val": 1000, "filed": "2025-10-30"}]}
            },
            "CostOfRevenue": {
                "units": {"USD": [{"form": "10-K", "fp": "FY", "fy": 2025, "end": "2025-09-30", "val": 400, "filed": "2025-10-30"}]}
            },
            "GrossProfit": {
                "units": {"USD": [{"form": "10-K", "fp": "FY", "fy": 2025, "end": "2025-09-30", "val": 600, "filed": "2025-10-30"}]}
            },
            "OperatingIncomeLoss": {
                "units": {"USD": [{"form": "10-K", "fp": "FY", "fy": 2025, "end": "2025-09-30", "val": 300, "filed": "2025-10-30"}]}
            },
            "NetIncomeLoss": {
                "units": {"USD": [{"form": "10-K", "fp": "FY", "fy": 2025, "end": "2025-09-30", "val": 200, "filed": "2025-10-30"}]}
            },
            "EarningsPerShareDiluted": {
                "units": {"USD/shares": [{"form": "10-K", "fp": "FY", "fy": 2025, "end": "2025-09-30", "val": 2.5, "filed": "2025-10-30"}]}
            },
        }
    }

    mapper = FinancialFactsMapper()

    history = mapper.history(facts, "DEMO")
    summary = mapper.summary(facts, "DEMO")

    assert history[0].revenue == 1000.0
    assert history[0].cost == 400.0
    assert history[0].eps == 2.5
    assert summary.net_sales == 1000.0


def test_financial_facts_mapper_uses_fact_period_year_for_comparative_rows():
    facts = {
        "us-gaap": {
            "RevenueFromContractWithCustomerExcludingAssessedTax": {
                "units": {
                    "USD": [
                        {
                            "form": "10-K",
                            "fp": "FY",
                            "fy": 2025,
                            "start": "2022-09-25",
                            "end": "2023-09-30",
                            "val": 800,
                            "filed": "2025-10-31",
                            "frame": "CY2023",
                        },
                        {
                            "form": "10-K",
                            "fp": "FY",
                            "fy": 2025,
                            "start": "2023-10-01",
                            "end": "2024-09-28",
                            "val": 900,
                            "filed": "2025-10-31",
                            "frame": "CY2024",
                        },
                        {
                            "form": "10-K",
                            "fp": "FY",
                            "fy": 2025,
                            "start": "2024-09-29",
                            "end": "2025-09-27",
                            "val": 1000,
                            "filed": "2025-10-31",
                            "frame": "CY2025",
                        },
                    ]
                }
            }
        }
    }

    history = FinancialFactsMapper().history(facts, "DEMO")

    assert [(year.year, year.year_end, year.revenue) for year in history] == [
        (2025, "2025-09-27", 1000.0),
        (2024, "2024-09-28", 900.0),
        (2023, "2023-09-30", 800.0),
    ]


def test_social_post_normalizer_limits_and_maps_fields():
    posts = SocialPostNormalizer().normalize_many(
        [
            {
                "id": "1",
                "text": "Demo post",
                "created_at": "2026-06-16T10:00:00+00:00",
                "author": {"name": "Demo", "username": "demo"},
                "reply_count": "2",
                "retweet_count": "3",
                "favorite_count": "4",
                "view_count": "5K",
            }
        ]
    )

    assert posts[0].author.handle == "@demo"
    assert posts[0].content == "Demo post"
    assert posts[0].views == 5000
