from __future__ import annotations

from app.logic.social import SocialPostNormalizer
from app.logic.social_search import build_social_search_query, normalize_social_min_faves
from app.logic.tickers import TickerNormalizer
from app.schemas import SocialLanguage, SocialMinFaves, SocialPostsResponse, SocialSort
from app.sources.twitter import TwitterSource


class SocialPostService:
    def __init__(
        self,
        twitter_source: TwitterSource | None = None,
        post_normalizer: SocialPostNormalizer | None = None,
    ) -> None:
        self.twitter_source = twitter_source or TwitterSource()
        self.post_normalizer = post_normalizer or SocialPostNormalizer()

    def posts(
        self,
        ticker: str,
        sort: SocialSort | str = SocialSort.hot,
        language: SocialLanguage | str = SocialLanguage.zh,
        min_faves: SocialMinFaves | int = SocialMinFaves.thirty,
        max_results: int = 50,
    ) -> SocialPostsResponse:
        normalized = TickerNormalizer.normalize(ticker)
        normalized_sort = SocialSort(sort)
        normalized_language = SocialLanguage(language)
        normalized_min_faves = normalize_social_min_faves(min_faves)
        product = "Top" if normalized_sort == SocialSort.hot else "Latest"
        query = build_social_search_query(normalized, normalized_language, normalized_min_faves)
        raw = self.twitter_source.search(query, max_results=min(max_results, 50), product=product)
        items = self.post_normalizer.normalize_many(raw.get("items", []), limit=50)
        return SocialPostsResponse(
            ticker=normalized,
            sort=normalized_sort,
            language=normalized_language,
            min_faves=normalized_min_faves,
            items=items,
        )
