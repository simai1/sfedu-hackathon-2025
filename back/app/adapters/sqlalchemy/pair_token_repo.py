import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pair_token import PairTokenModel
from app.domains.pair_token import CreatePairToken, PairToken

class PairTokenRepo():
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, create_pair_token: CreatePairToken) -> PairToken:
        pair_token_model = PairTokenModel(
            **create_pair_token.model_dump(),
        )        

        self.session.add(pair_token_model)
        await self.session.commit()
        await self.session.refresh(pair_token_model)

        return PairTokenModel(**pair_token_model.as_dict())

    async def get_one_by_id(self, id: uuid.UUID) -> PairToken | None:
        pair_token_model = await self.session.get(PairTokenModel, id)
        if not pair_token_model:
            return None
        else:
            return PairTokenModel(**pair_token_model.as_dict())
