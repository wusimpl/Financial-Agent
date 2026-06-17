import os

from app.core.env import load_env_file


def test_load_env_file_reads_simple_values(tmp_path, monkeypatch):
    env_path = tmp_path / ".env"
    env_path.write_text(
        '\n'.join(
            [
                "# local config",
                'FINANCIAL_AGENT_SEC_USER_AGENT="financial-agent test@example.com"',
                "FINANCIAL_AGENT_REQUEST_TIMEOUT=30",
            ]
        )
    )

    monkeypatch.delenv("FINANCIAL_AGENT_SEC_USER_AGENT", raising=False)
    monkeypatch.delenv("FINANCIAL_AGENT_REQUEST_TIMEOUT", raising=False)

    load_env_file(env_path)

    assert os.environ["FINANCIAL_AGENT_SEC_USER_AGENT"] == "financial-agent test@example.com"
    assert os.environ["FINANCIAL_AGENT_REQUEST_TIMEOUT"] == "30"


def test_load_env_file_keeps_existing_environment_value(tmp_path, monkeypatch):
    env_path = tmp_path / ".env"
    env_path.write_text("FINANCIAL_AGENT_REQUEST_TIMEOUT=30")
    monkeypatch.setenv("FINANCIAL_AGENT_REQUEST_TIMEOUT", "45")

    load_env_file(env_path)

    assert os.environ["FINANCIAL_AGENT_REQUEST_TIMEOUT"] == "45"
