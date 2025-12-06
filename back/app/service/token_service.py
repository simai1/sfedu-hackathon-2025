import datetime

from jose import ExpiredSignatureError, JWTError, jwt

from app.core.config import settings
from app.domains.token import Payload
from app.domains.user import User


class TokenService():
    def __init__(self) -> None:
        self.secret_key = settings.JWT_SECRET
        self.algorithm = settings.JWT_ALGORITHM

    def generate_access_token(self, user: User) -> str:
        now = datetime.datetime.now(datetime.timezone.utc)
        payload = Payload(
            sub=str(user.id),
            role=user.role,
            iat=now,
            exp=now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        return jwt.encode(
            payload.model_dump(), self.secret_key, algorithm=self.algorithm
        )

    def validate_access_token(self, token: str) -> Payload:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return Payload(**payload)
        except ExpiredSignatureError:
            raise ValueError("Access token expired")
        except JWTError:
            raise ValueError("Invalid access token")
