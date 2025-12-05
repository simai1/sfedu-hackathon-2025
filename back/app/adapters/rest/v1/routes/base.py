from fastapi import APIRouter
from app.adapters.rest.v1.routes.auth import router as auth_router

router = APIRouter()

router.include_router(router=auth_router, prefix="/auth")
