from app.sources.sec import SecFilingsSource
from app.services.sec import SecFilingService


class FakeSecSource(SecFilingsSource):
    def __init__(self):
        pass

    def find_company(self, ticker):
        return {
            "ticker": ticker.upper(),
            "title": "Demo Corp",
            "cik": "123456",
            "cikPadded": "0000123456",
        }

    def _submissions(self, company):
        return {
            "filings": {
                "recent": {
                    "form": ["10-K", "10-Q"],
                    "filingDate": ["2025-02-10", "2025-05-01"],
                    "reportDate": ["2024-12-31", "2025-03-31"],
                    "accessionNumber": ["0000000000-25-000001", "0000000000-25-000002"],
                    "primaryDocument": ["demo-20241231.htm", "demo-20250331.htm"],
                    "primaryDocDescription": ["10-K", "10-Q"],
                },
                "files": [{"name": "CIK0000123456-submissions-001.json"}],
            }
        }

    def _historical_submissions(self, file_name):
        return {
            "form": ["10-K"],
            "filingDate": ["2014-03-01"],
            "reportDate": ["2013-12-31"],
            "accessionNumber": ["0000000000-14-000001"],
            "primaryDocument": ["demo-20131231.htm"],
            "primaryDocDescription": ["10-K"],
        }


def test_list_filings_filters_by_report_year():
    source = FakeSecSource()

    result = source.list_filings("demo", forms=("10-K",), year=2024)

    assert result["items"][0]["reportDate"] == "2024-12-31"
    assert result["items"][0]["filingDate"] == "2025-02-10"


def test_list_filings_can_filter_by_filing_year():
    source = FakeSecSource()

    result = source.list_filings("demo", forms=("10-K",), year=2025, year_basis="filing")

    assert result["items"][0]["reportDate"] == "2024-12-31"


def test_list_filings_reads_historical_files_for_year_filter():
    source = FakeSecSource()

    result = source.list_filings("demo", forms=("10-K",), year=2013)

    assert result["items"][0]["primaryDocument"] == "demo-20131231.htm"


def test_document_with_base_adds_default_injections_without_dark_mode():
    document = "<html><head></head><body>Demo</body></html>"

    result = SecFilingService._document_with_base(document, "https://www.sec.gov/demo.htm")

    assert '<base href="https://www.sec.gov/demo.htm">' in result
    assert "financial-agent-sec-anchor-navigation" in result
    assert "financial-agent-sec-dark-mode" not in result


def test_document_with_base_can_add_dark_mode_styles():
    document = "<html><head></head><body>Demo</body></html>"

    result = SecFilingService._document_with_base(document, "https://www.sec.gov/demo.htm", dark=True)

    assert "financial-agent-sec-dark-mode" in result
    assert "background: #0B0E14 !important" in result


def test_document_with_base_intercepts_local_anchor_links():
    document = '<html><head></head><body><a href="#item-1">Business</a><h1 id="item-1">Item 1.</h1></body></html>'

    result = SecFilingService._document_with_base(document, "https://www.sec.gov/demo.htm")

    assert 'link.getAttribute("href")' in result
    assert 'href.charAt(0) !== "#"' in result
    assert "target.scrollIntoView" in result
