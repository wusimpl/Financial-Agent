from app.errors import AppError, NotFoundError, SourceStatusBuilder


def test_app_error_response_is_stable():
    response = AppError("Bad request").response()

    assert response.error == "app_error"
    assert response.message == "Bad request"


def test_not_found_error_uses_404_code():
    error = NotFoundError("Missing")

    assert error.status_code == 404
    assert error.response().error == "not_found"


def test_source_status_builder_distinguishes_success_empty_and_failure():
    builder = SourceStatusBuilder()

    success = builder.success([1])
    empty = builder.success([])
    failure = builder.failure("failed")

    assert success.ok is True
    assert success.empty is False
    assert empty.ok is True
    assert empty.empty is True
    assert failure.ok is False
    assert failure.empty is True
    assert failure.error == "failed"
