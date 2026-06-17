from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from app.core.env import load_env_file


@dataclass(frozen=True)
class CachePolicy:
    twitter_seconds: int
    market_seconds: int
    sec_index_seconds: int
    sec_submissions_seconds: int
    sec_facts_seconds: int


@dataclass(frozen=True)
class Settings:
    backend_root: Path
    cache_dir: Path
    watchlist_path: Path
    default_watchlist: tuple[str, ...]
    sec_user_agent: str
    request_timeout_seconds: int
    twitter_browser: str
    twitter_cache_seconds: int
    market_cache_seconds: int
    sec_index_cache_seconds: int
    sec_submissions_cache_seconds: int
    sec_facts_cache_seconds: int
    cache_policy: CachePolicy


def get_settings() -> Settings:
    backend_root = Path(__file__).resolve().parents[2]
    load_env_file(backend_root.parent / ".env")

    cache_dir = Path(os.getenv("FINANCIAL_AGENT_CACHE_DIR", backend_root / "data" / "cache"))
    watchlist_path = Path(os.getenv("FINANCIAL_AGENT_WATCHLIST_PATH", backend_root / "data" / "watchlist.json"))
    default_watchlist = tuple(
        ticker.strip().upper()
        for ticker in os.getenv("FINANCIAL_AGENT_DEFAULT_WATCHLIST", "AAPL,TSLA,MSFT").split(",")
        if ticker.strip()
    )
    sec_user_agent = os.getenv(
        "FINANCIAL_AGENT_SEC_USER_AGENT",
        "financial-agent/0.1 set-FINANCIAL_AGENT_SEC_USER_AGENT",
    )
    twitter_cache_seconds = int(os.getenv("FINANCIAL_AGENT_TWITTER_CACHE_SECONDS", "600"))
    market_cache_seconds = int(os.getenv("FINANCIAL_AGENT_MARKET_CACHE_SECONDS", "900"))
    sec_index_cache_seconds = int(os.getenv("FINANCIAL_AGENT_SEC_INDEX_CACHE_SECONDS", "86400"))
    sec_submissions_cache_seconds = int(os.getenv("FINANCIAL_AGENT_SEC_SUBMISSIONS_CACHE_SECONDS", "3600"))
    sec_facts_cache_seconds = int(os.getenv("FINANCIAL_AGENT_SEC_FACTS_CACHE_SECONDS", "21600"))

    return Settings(
        backend_root=backend_root,
        cache_dir=cache_dir,
        watchlist_path=watchlist_path,
        default_watchlist=default_watchlist,
        sec_user_agent=sec_user_agent,
        request_timeout_seconds=int(os.getenv("FINANCIAL_AGENT_REQUEST_TIMEOUT", "20")),
        twitter_browser=os.getenv("TWITTER_BROWSER", "edge"),
        twitter_cache_seconds=twitter_cache_seconds,
        market_cache_seconds=market_cache_seconds,
        sec_index_cache_seconds=sec_index_cache_seconds,
        sec_submissions_cache_seconds=sec_submissions_cache_seconds,
        sec_facts_cache_seconds=sec_facts_cache_seconds,
        cache_policy=CachePolicy(
            twitter_seconds=twitter_cache_seconds,
            market_seconds=market_cache_seconds,
            sec_index_seconds=sec_index_cache_seconds,
            sec_submissions_seconds=sec_submissions_cache_seconds,
            sec_facts_seconds=sec_facts_cache_seconds,
        ),
    )
