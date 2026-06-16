from app.sources.sec import SecFilingsSource


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
