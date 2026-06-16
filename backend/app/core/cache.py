from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path
from typing import Any


class FileCache:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def get_json(self, namespace: str, key: str, max_age_seconds: int | None = None) -> Any | None:
        payload = self._read_payload(namespace, key, max_age_seconds)
        if payload is None:
            return None
        return payload["data"]

    def set_json(self, namespace: str, key: str, data: Any) -> None:
        self._write_payload(namespace, key, data)

    def get_text(self, namespace: str, key: str, max_age_seconds: int | None = None) -> str | None:
        payload = self._read_payload(namespace, key, max_age_seconds)
        if payload is None:
            return None
        data = payload["data"]
        return data if isinstance(data, str) else None

    def set_text(self, namespace: str, key: str, text: str) -> None:
        self._write_payload(namespace, key, text)

    def _read_payload(self, namespace: str, key: str, max_age_seconds: int | None) -> dict[str, Any] | None:
        path = self._path(namespace, key)
        if not path.exists():
            return None

        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None

        if not isinstance(payload, dict) or "created_at" not in payload or "data" not in payload:
            return None

        if max_age_seconds is not None and time.time() - float(payload["created_at"]) > max_age_seconds:
            return None

        return payload

    def _write_payload(self, namespace: str, key: str, data: Any) -> None:
        path = self._path(namespace, key)
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"created_at": time.time(), "data": data}
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    def _path(self, namespace: str, key: str) -> Path:
        digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
        return self.root / namespace / f"{digest}.json"
