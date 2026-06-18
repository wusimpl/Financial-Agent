from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas import SocialLanguage, SocialMinFaves, SocialPostsResponse, SocialSort
from app.services.social import SocialPostService

router = APIRouter(prefix="/social", tags=["social"])

social_service = SocialPostService()


@router.get("/{ticker}/posts", response_model=SocialPostsResponse)
def posts(
    ticker: str,
    sort: SocialSort = Query(SocialSort.hot),
    language: SocialLanguage = Query(SocialLanguage.zh),
    min_faves: SocialMinFaves = Query(SocialMinFaves.thirty),
    max_results: int = Query(50, ge=1, le=50),
) -> SocialPostsResponse:
    return social_service.posts(
        ticker,
        sort=sort,
        language=language,
        min_faves=min_faves,
        max_results=max_results,
    )
