from fastapi import APIRouter, Depends, Form, Request
from app.composites.auth_composite import get_controller
from app.adapters.rest.v1.controllers.auth import AuthController
from app.domains.user import CreateUser, ValidateUser

router = APIRouter()

@router.post("/login")
async def post_login(
    email: str = Form(...),
    password: str = Form(...),
    controller: AuthController = Depends(get_controller),
):
    validate_user = ValidateUser(email=email, password=password)
    return await controller.login(validate_user)

@router.post("/register")
async def register(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    controller: AuthController = Depends(get_controller),
):
    create_user = CreateUser(email=email, password=password, name=name)
    return await controller.register(create_user)
