from typing import Literal

from fastapi import APIRouter, Depends
from app.composites.auth_composite import get_controller
from app.adapters.rest.v1.controllers.auth import AuthController
from app.domains.user import CreateUser, ValidateUser
from app.domains.auth import AuthUser
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=AuthUser)
async def post_login(
    login_req: LoginRequest,
    controller: AuthController = Depends(get_controller),
):
    validate_user = ValidateUser(email=login_req.email, password=login_req.password)
    return await controller.login(validate_user)

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: Literal["user", "organization"]


@router.post("/register", response_model=AuthUser)
async def register(
    register_req: RegisterRequest,
    controller: AuthController = Depends(get_controller),
):
    create_user = CreateUser(
        email=register_req.email,
        password=register_req.password,
        name=register_req.name,
        role=register_req.role,
    )
    return await controller.register(create_user)
