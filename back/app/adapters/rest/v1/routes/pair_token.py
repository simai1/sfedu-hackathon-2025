from fastapi import APIRouter, Depends, Form, Query
from app.composites.pair_token_composite import get_controller
from app.adapters.rest.v1.controllers.auth import AuthController
from app.domains.user import CreateUser, ValidateUser
from app.domains.auth import AuthUser
from app.adapters.rest.v1.controllers.pair_token import PairTokenController
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="ya s ruletom na balkone")


@router.post("/", response_model=str)
async def generate(
    token: str = Depends(oauth2_scheme),
    controller: PairTokenController = Depends(get_controller),
):
    return await controller.generate(access_token=token)

@router.get("/letsgo", response_model=bool)
async def register(
    pair_token: str = Query(...),
    controller: PairTokenController = Depends(get_controller),
):
    return await controller.pair_token_service.validate(pair_token)
