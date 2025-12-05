import uuid
from http import HTTPStatus

from fastapi import HTTPException


class ClientNotFoundError(HTTPException):
    def __init__(self, client_id: uuid.UUID):
        super().__init__(
            status_code=HTTPStatus.NOT_FOUND,
            detail=f"Not found client with id '{client_id}'",
        )
        self.client_id = client_id
