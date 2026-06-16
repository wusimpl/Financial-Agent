from pathlib import Path

from app.core.config import CachePolicy, Settings
from app.core.watchlist import WatchlistStore


def _settings(path: Path) -> Settings:
    cache_policy = CachePolicy(
        twitter_seconds=1,
        market_seconds=2,
        sec_index_seconds=3,
        sec_submissions_seconds=4,
        sec_facts_seconds=5,
    )
    return Settings(
        backend_root=path.parent,
        cache_dir=path.parent / "cache",
        watchlist_path=path,
        default_watchlist=("AAPL", "MSFT"),
        sec_user_agent="test",
        request_timeout_seconds=1,
        twitter_browser="edge",
        twitter_cache_seconds=cache_policy.twitter_seconds,
        market_cache_seconds=cache_policy.market_seconds,
        sec_index_cache_seconds=cache_policy.sec_index_seconds,
        sec_submissions_cache_seconds=cache_policy.sec_submissions_seconds,
        sec_facts_cache_seconds=cache_policy.sec_facts_seconds,
        cache_policy=cache_policy,
    )


def test_watchlist_store_returns_default_when_file_is_missing(tmp_path):
    store = WatchlistStore(settings=_settings(tmp_path / "watchlist.json"))

    assert store.list_tickers() == ["AAPL", "MSFT"]


def test_watchlist_store_persists_normalized_unique_tickers(tmp_path):
    store = WatchlistStore(settings=_settings(tmp_path / "watchlist.json"))

    store.save_tickers([" aapl ", "AAPL", "tsla"])

    assert store.list_tickers() == ["AAPL", "TSLA"]
