from app.service.pair_token_service import PairTokenService
from app.domains.pair_token import PairToken


class PairTokenController:
    def __init__(self, pair_token_service: PairTokenService):
        self.pair_token_service = pair_token_service

    async def generate(self, access_token: str) -> str:
        pair_token = await self.pair_token_service.generate(access_token)
        return str(pair_token.id)

    async def validate(self, pair_token_str: str) -> PairToken | None:
        return await self.pair_token_service.validate(pair_token_str)