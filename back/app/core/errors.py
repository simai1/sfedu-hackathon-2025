import datetime
import uuid
from typing import Any


class DomainBaseError(Exception):
    def __init__(self, *args: object) -> None:
        super().__init__(*args)


class NotFoundError(DomainBaseError):
    def __init__(self, entity: str, param: str, value: Any = None):
        self.entity = entity
        self.entity_id = value
        message = (
            f"{entity} with {param} {value} not found"
            if value is not None
            else f"{entity} not found"
        )
        super().__init__(message)


class InvalidDataError(DomainBaseError):
    def __init__(self, entity: str, param: str, value: Any = None):
        self.entity = entity
        self.entity_id = value
        message = f"Invalid {param} {value if value else ''} for {entity}"
        super().__init__(message)


class ValidationError(DomainBaseError):
    def __init__(self, entity: str):
        self.entity = entity
        message = f"Validation error for {entity}"
        super().__init__(message)


class ExpirationError(DomainBaseError):
    def __init__(self, entity: str, exp_at: datetime.datetime):
        self.entity = entity
        formatted_date = exp_at.strftime("%d.%m.%Y %H:%M:%S.%f")[:-3]
        message = f"{entity} expired at {formatted_date}"
        super().__init__(message)


class AlreadyUserError(DomainBaseError):
    def __init__(self, entity: str):
        self.entity = entity
        message = f"Already used {entity}"
        super().__init__(message)


class NotAuthenticatedError(DomainBaseError):
    def __init__(self, entity: str, field: str, value: uuid.UUID):
        self.entity = entity
        message = f"No {entity} with {field} {value}"
        super().__init__(message)
