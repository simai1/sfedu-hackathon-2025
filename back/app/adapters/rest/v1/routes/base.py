from fastapi import APIRouter
from app.adapters.rest.v1.routes.auth import router as auth_router
from app.adapters.rest.v1.routes.pair_token import router as pair_token_router

router = APIRouter()

router.include_router(router=auth_router, prefix="/auth")
router.include_router(router=pair_token_router, prefix="/pair-token")
