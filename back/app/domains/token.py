import datetime

from pydantic import BaseModel


class Payload(BaseModel):
    sub: str
    iat: datetime.datetime
    exp: datetime.datetime
