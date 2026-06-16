from app.core.cache import FileCache


def test_file_cache_roundtrip(tmp_path):
    cache = FileCache(tmp_path)
    cache.set_json("demo", "key", {"ok": True})

    assert cache.get_json("demo", "key") == {"ok": True}
