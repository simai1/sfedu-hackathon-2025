import datetime
import uuid
from pydantic import BaseModel


class PairToken(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    expires_at: datetime.datetime
    created_at: datetime.datetime

class CreatePairToken(BaseModel):
    user_id: uuid.UUID