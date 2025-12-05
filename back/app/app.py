from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import Request
from fastapi.responses import JSONResponse
from http import HTTPStatus
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from pydantic_core import ValidationError
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.adapters.rest.v1.errors.base import RestBaseError
from app.adapters.rest.v1.routes.base import router as v1_router
from app.core.config import settings
from app.core.db import engine
from app.core.errors import DomainBaseError
from app.core.exception_handlers import (
    domain_exception_handler,
    http_exception_handler,
    sqlalchemy_exception_handler,
    validation_exception_handler,
    universal_exception_handler,
)
from app.utils.migration import upgrade
from app.core.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    await upgrade(engine)

    yield
    # shutdown


def create_app():
    # init app
    if settings.NODE_ENV != "production":
        app = FastAPI(lifespan=lifespan)
    else:
        app = FastAPI(lifespan=lifespan)

    # routers
    app.include_router(router=v1_router, prefix="/v1", tags=["v1"])

    # static files
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(exist_ok=True)

    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

    # CORS
    app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3001",  
        "https://my-frontend.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_exceptions(request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.exception(f"Unexpected error: {exc}")  # Логируем исключение
            return JSONResponse(
                content={
                    "detail": str(exc),
                    "error_type": type(exc).__name__,
                },
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            )

    # handlers
    # app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    # app.add_exception_handler(ValidationError, validation_exception_handler)
    # app.add_exception_handler(RequestValidationError, validation_exception_handler)
    # app.add_exception_handler(IntegrityError, sqlalchemy_exception_handler)
    # app.add_exception_handler(DomainBaseError, domain_exception_handler)
    # app.add_exception_handler(RestBaseError, http_exception_handler)
    # app.add_exception_handler(Exception, universal_exception_handler)

    return app
