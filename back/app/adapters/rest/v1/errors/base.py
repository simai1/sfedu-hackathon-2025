from http import HTTPStatus
from typing import Any, Dict

from fastapi import HTTPException


class RestBaseError(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: Any = None,
        headers: Dict[str, str] | None = None,
    ) -> None:
        super().__init__(status_code, detail, headers)


class HttpMissingError(RestBaseError):
    def __init__(self, field: str) -> None:
        super().__init__(status_code=HTTPStatus.BAD_REQUEST, detail=f"Missing {field}")


class HttpInvalidDataError(RestBaseError):
    def __init__(self, field: str) -> None:
        super().__init__(status_code=HTTPStatus.BAD_REQUEST, detail=f"Missing {field}")
