from fastapi import APIRouter
from app.adapters.rest.v1.routes.auth import router as auth_router
from app.adapters.rest.v1.routes.pair_token import router as pair_token_router
from app.adapters.rest.v1.routes.upload import router as upload_router
from app.adapters.rest.v1.routes.video import router as video_router

router = APIRouter()

router.include_router(router=auth_router, prefix="/auth")
router.include_router(router=pair_token_router, prefix="/pair-token")
router.include_router(router=upload_router)
router.include_router(router=video_router)
