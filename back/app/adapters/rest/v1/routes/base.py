from fastapi import APIRouter
from app.adapters.rest.v1.routes.auth import router as auth_router
from app.adapters.rest.v1.routes.pair_token import router as pair_token_router
from app.adapters.rest.v1.routes.upload import router as upload_router
from app.adapters.rest.v1.routes.video import router as video_router
from app.adapters.rest.v1.routes.organization import router as organization_router
from app.adapters.rest.v1.routes.user import router as user_router
from app.adapters.rest.v1.routes.group import router as group_router
from app.adapters.rest.v1.routes.engagement import router as eeg_router
from app.adapters.rest.v1.routes.history import router as history_router

router = APIRouter()

router.include_router(router=auth_router, prefix="/auth")
router.include_router(router=pair_token_router, prefix="/pair-token")
router.include_router(router=upload_router)
router.include_router(router=video_router)
router.include_router(router=organization_router, prefix="/organization")
router.include_router(router=user_router, prefix="/users")
router.include_router(router=group_router, prefix="/groups")
router.include_router(router=eeg_router, prefix="/eeg")
router.include_router(router=history_router, prefix="/history")