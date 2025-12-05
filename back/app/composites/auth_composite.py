from fastapi import Depends
from app.composites.user_composite import get_service as get_user_service
from app.adapters.rest.v1.controllers.auth import AuthController

async def get_controller(
    auth_service=Depends(get_user_service),
):
    return AuthController(auth_service)
