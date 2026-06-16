from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.schemas import ApiErrorResponse, SourceState
from app.sources.errors import SourceError


class AppError(RuntimeError):
    status_code = 400
    error_code = "app_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message

    def response(self) -> ApiErrorResponse:
        return ApiErrorResponse(error=self.error_code, message=self.message)


class NotFoundError(AppError):
    status_code = 404
    error_code = "not_found"


class SourceStatusBuilder:
    def success(self, data: Any = None) -> SourceState:
        return SourceState(ok=True, empty=self._is_empty(data), updated_at=self._now())

    def empty(self) -> SourceState:
        return SourceState(ok=True, empty=True, updated_at=self._now())

    def failure(self, error: Exception | str) -> SourceState:
        message = str(error)
        return SourceState(ok=False, empty=True, error=message, updated_at=self._now())

    @staticmethod
    def _is_empty(data: Any) -> bool:
        if data is None:
            return True
        if isinstance(data, (list, tuple, set, dict, str)):
            return len(data) == 0
        if hasattr(data, "points"):
            return len(getattr(data, "points")) == 0
        if hasattr(data, "years"):
            return len(getattr(data, "years")) == 0
        if hasattr(data, "items"):
            return len(getattr(data, "items")) == 0
        return False

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()


__all__ = [
    "ApiErrorResponse",
    "AppError",
    "NotFoundError",
    "SourceError",
    "SourceStatusBuilder",
]
