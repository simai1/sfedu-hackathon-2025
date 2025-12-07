from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer

from app.composites.history_composite import get_controller
from app.domains.history import HistoryRecord
from app.adapters.rest.v1.controllers.history import HistoryController

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="ya s ruletom na balkone")


@router.get("/", response_model=list[HistoryRecord])
async def get_self(
    token: str = Depends(oauth2_scheme),
    controller: HistoryController = Depends(get_controller),
):
    return await controller.get_all_by_user_id(token)
