from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    backend_root: Path
    cache_dir: Path
    sec_user_agent: str
    request_timeout_seconds: int
    twitter_browser: str
    twitter_cache_seconds: int
    market_cache_seconds: int
    sec_index_cache_seconds: int
    sec_submissions_cache_seconds: int
    sec_facts_cache_seconds: int


def get_settings() -> Settings:
    backend_root = Path(__file__).resolve().parents[2]
    cache_dir = Path(os.getenv("FINANCIAL_AGENT_CACHE_DIR", backend_root / "data" / "cache"))
    sec_user_agent = os.getenv(
        "FINANCIAL_AGENT_SEC_USER_AGENT",
        "financial-agent/0.1 set-FINANCIAL_AGENT_SEC_USER_AGENT",
    )

    return Settings(
        backend_root=backend_root,
        cache_dir=cache_dir,
        sec_user_agent=sec_user_agent,
        request_timeout_seconds=int(os.getenv("FINANCIAL_AGENT_REQUEST_TIMEOUT", "20")),
        twitter_browser=os.getenv("TWITTER_BROWSER", "edge"),
        twitter_cache_seconds=int(os.getenv("FINANCIAL_AGENT_TWITTER_CACHE_SECONDS", "600")),
        market_cache_seconds=int(os.getenv("FINANCIAL_AGENT_MARKET_CACHE_SECONDS", "900")),
        sec_index_cache_seconds=int(os.getenv("FINANCIAL_AGENT_SEC_INDEX_CACHE_SECONDS", "86400")),
        sec_submissions_cache_seconds=int(os.getenv("FINANCIAL_AGENT_SEC_SUBMISSIONS_CACHE_SECONDS", "3600")),
        sec_facts_cache_seconds=int(os.getenv("FINANCIAL_AGENT_SEC_FACTS_CACHE_SECONDS", "21600")),
    )
