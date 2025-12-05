from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

from app.models.user import UserModel
from app.models.pair_token import PairTokenModel

__all__ = [
    "Base",
    "UserModel",
    "PairTokenModel"
]
