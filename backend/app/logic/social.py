from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.schemas import SocialAuthor, SocialPost


class SocialPostNormalizer:
    def normalize_many(self, rows: list[dict[str, Any]], limit: int = 50) -> list[SocialPost]:
        return [self.normalize(row) for row in rows[:limit] if isinstance(row, dict)]

    def normalize(self, row: dict[str, Any]) -> SocialPost:
        author = row.get("author") if isinstance(row.get("author"), dict) else row.get("user", {})
        author = author if isinstance(author, dict) else {}
        name = str(author.get("name") or author.get("display_name") or row.get("author") or "")
        handle = author.get("username") or author.get("screen_name") or author.get("handle")
        handle_text = self._handle(handle)
        return SocialPost(
            id=str(row.get("id") or row.get("id_str") or row.get("tweet_id") or row.get("rest_id") or ""),
            author=SocialAuthor(
                name=name or handle_text or "Unknown",
                handle=handle_text,
                avatar=self._avatar(author, name, handle_text),
            ),
            content=str(row.get("text") or row.get("full_text") or row.get("content") or ""),
            published_at=self._published_at(row),
            relative_time=self._relative_time(row),
            replies=self._int(row.get("reply_count", row.get("replies", 0))),
            reposts=self._int(row.get("retweet_count", row.get("retweets", row.get("reposts", 0)))),
            likes=self._int(row.get("favorite_count", row.get("likes", 0))),
            views=self._optional_int(row.get("view_count", row.get("views"))),
            raw=row,
        )

    def _published_at(self, row: dict[str, Any]) -> str | None:
        value = row.get("created_at") or row.get("published_at") or row.get("date")
        if value is None:
            return None
        return str(value)

    def _relative_time(self, row: dict[str, Any]) -> str | None:
        explicit = row.get("relative_time") or row.get("timeAgo") or row.get("time_ago")
        if explicit:
            return str(explicit)

        published_at = self._published_at(row)
        if not published_at:
            return None
        try:
            published = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        except ValueError:
            return None
        delta = datetime.now(timezone.utc) - published.astimezone(timezone.utc)
        seconds = max(int(delta.total_seconds()), 0)
        if seconds < 3600:
            return f"{max(seconds // 60, 1)}m"
        if seconds < 86400:
            return f"{seconds // 3600}h"
        return f"{seconds // 86400}d"

    @staticmethod
    def _handle(value: Any) -> str | None:
        if not value:
            return None
        text = str(value)
        return text if text.startswith("@") else f"@{text}"

    @staticmethod
    def _avatar(author: dict[str, Any], name: str, handle: str | None) -> str:
        image = author.get("profile_image_url") or author.get("avatar")
        if image:
            return str(image)
        seed = name or handle or "?"
        return seed[:1].upper()

    def _optional_int(self, value: Any) -> int | None:
        if value is None or value == "":
            return None
        return self._int(value)

    @staticmethod
    def _int(value: Any) -> int:
        if isinstance(value, str):
            normalized = value.strip().replace(",", "")
            suffix = normalized[-1:].upper()
            multiplier = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}.get(suffix, 1)
            if multiplier != 1:
                normalized = normalized[:-1]
            try:
                return int(float(normalized) * multiplier)
            except ValueError:
                return 0
        try:
            return int(value)
        except (TypeError, ValueError):
            return 0
