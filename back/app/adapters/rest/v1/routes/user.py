from fastapi import APIRouter, Depends, Body
from fastapi.security import OAuth2PasswordBearer

from app.adapters.rest.v1.controllers.user import UserController
from app.composites.user_composite import get_controller
from app.domains.user import UpdateUser, UserProfile

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="ya s ruletom na balkone")


@router.get("/self", response_model=UserProfile)
async def get_self(
    token: str = Depends(oauth2_scheme),
    controller: UserController = Depends(get_controller),
):
    return await controller.get_self(access_token=token)


@router.put("/self", response_model=UserProfile)
async def update_self(
    update_user: UpdateUser = Body(...),
    token: str = Depends(oauth2_scheme),
    controller: UserController = Depends(get_controller),
):
    return await controller.update_self(access_token=token, update_user=update_user)

