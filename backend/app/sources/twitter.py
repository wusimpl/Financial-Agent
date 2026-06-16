from __future__ import annotations

import json
import os
import shutil
import subprocess
from typing import Any

from app.core.cache import FileCache
from app.core.config import Settings, get_settings
from app.sources.errors import SourceError


class TwitterSource:
    products = {"Top", "Latest", "Photos", "Videos"}

    def __init__(self, settings: Settings | None = None, cache: FileCache | None = None) -> None:
        self.settings = settings or get_settings()
        self.cache = cache or FileCache(self.settings.cache_dir)

    def search(self, query: str, max_results: int = 20, product: str = "Latest") -> dict[str, Any]:
        normalized_query = query.strip()
        if not normalized_query:
            raise SourceError("搜索关键词不能为空")
        if max_results <= 0 or max_results > 100:
            raise SourceError("推文数量必须在 1 到 100 之间")
        if product not in self.products:
            raise SourceError(f"不支持的搜索类型：{product}")

        cache_key = f"search:{product}:{max_results}:{normalized_query}"
        cached = self.cache.get_json("twitter", cache_key, self.settings.twitter_cache_seconds)
        if cached is not None:
            return cached

        result = self._run_twitter(["search", normalized_query, "-t", product, "--max", str(max_results), "--json"])
        self.cache.set_json("twitter", cache_key, result)
        return result

    def user_posts(self, username: str, max_results: int = 20) -> dict[str, Any]:
        normalized = username.strip().lstrip("@")
        if not normalized:
            raise SourceError("用户名不能为空")
        if max_results <= 0 or max_results > 100:
            raise SourceError("推文数量必须在 1 到 100 之间")

        cache_key = f"user-posts:{normalized}:{max_results}"
        cached = self.cache.get_json("twitter", cache_key, self.settings.twitter_cache_seconds)
        if cached is not None:
            return cached

        result = self._run_twitter(["user-posts", normalized, "--max", str(max_results), "--json"])
        self.cache.set_json("twitter", cache_key, result)
        return result

    def _run_twitter(self, args: list[str]) -> dict[str, Any]:
        exe = shutil.which("twitter")
        if not exe:
            raise SourceError("未找到 twitter 命令")

        env = os.environ.copy()
        env["TWITTER_BROWSER"] = self.settings.twitter_browser
        proc = subprocess.run(
            [exe, *args],
            text=True,
            capture_output=True,
            timeout=self.settings.request_timeout_seconds,
            env=env,
        )

        if proc.returncode != 0:
            message = (proc.stderr or proc.stdout).strip()
            raise SourceError(f"Twitter 请求失败：{message}")

        try:
            payload = json.loads(proc.stdout)
        except json.JSONDecodeError as exc:
            raise SourceError("Twitter 返回内容不是有效 JSON") from exc

        if not payload.get("ok", False):
            error = payload.get("error") or {}
            message = error.get("message") or "Twitter 请求失败"
            raise SourceError(message)

        return {"items": payload.get("data", []), "pagination": payload.get("pagination")}
