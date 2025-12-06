import uuid

from app.adapters.sqlalchemy.pair_token_repo import PairTokenRepo
from app.domains.pair_token import CreatePairToken, PairToken
from app.service.token_service import TokenService


class PairTokenService():
    def __init__(self, repo: PairTokenRepo, token_service: TokenService) -> None:
        self.repo = repo
        self.token_service = token_service

    async def generate(self, access_token: str) -> PairToken:
        payload = self.token_service.validate_access_token(access_token)

        return await self.repo.create(CreatePairToken(user_id=uuid.UUID(payload.sub)))


    async def validate(self, pair_token_str: str) -> PairToken | None:
        return await self.repo.get_one_by_id(uuid.UUID(pair_token_str))
        
