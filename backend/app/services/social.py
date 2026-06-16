from __future__ import annotations

from app.logic.social import SocialPostNormalizer
from app.logic.tickers import TickerNormalizer
from app.schemas import SocialPostsResponse, SocialSort
from app.sources.stocks import StockDirectorySource
from app.sources.twitter import TwitterSource


class SocialPostService:
    def __init__(
        self,
        twitter_source: TwitterSource | None = None,
        directory_source: StockDirectorySource | None = None,
        post_normalizer: SocialPostNormalizer | None = None,
    ) -> None:
        self.twitter_source = twitter_source or TwitterSource()
        self.directory_source = directory_source or StockDirectorySource()
        self.post_normalizer = post_normalizer or SocialPostNormalizer()

    def posts(
        self,
        ticker: str,
        sort: SocialSort | str = SocialSort.latest,
        max_results: int = 50,
    ) -> SocialPostsResponse:
        normalized = TickerNormalizer.normalize(ticker)
        normalized_sort = SocialSort(sort)
        company = self.directory_source.find(normalized)
        company_name = company.get("title") or normalized
        product = "Top" if normalized_sort == SocialSort.hot else "Latest"
        query = f"${normalized} OR \"{company_name}\""
        raw = self.twitter_source.search(query, max_results=min(max_results, 50), product=product)
        items = self.post_normalizer.normalize_many(raw.get("items", []), limit=50)
        return SocialPostsResponse(ticker=normalized, sort=normalized_sort, items=items)
