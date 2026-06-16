from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas import SocialPostsResponse, SocialSort
from app.services.social import SocialPostService

router = APIRouter(prefix="/social", tags=["social"])

social_service = SocialPostService()


@router.get("/{ticker}/posts", response_model=SocialPostsResponse)
def posts(
    ticker: str,
    sort: SocialSort = Query(SocialSort.latest),
    max_results: int = Query(50, ge=1, le=50),
) -> SocialPostsResponse:
    return social_service.posts(ticker, sort=sort, max_results=max_results)
