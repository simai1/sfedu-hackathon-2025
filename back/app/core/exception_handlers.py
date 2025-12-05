from http import HTTPStatus

from fastapi.responses import JSONResponse

from app.core.config import settings


async def http_exception_handler(request, exc):
    return JSONResponse(
        content={
            "detail": str(exc.detail),
            "error_type": type(exc).__name__,
        },
        status_code=exc.status_code,
    )


async def validation_exception_handler(request, exc):
    return JSONResponse(
        content={
            "detail": str(exc)
            if settings.NODE_ENV != "production"
            else "Invalid request",
            "error_type": type(exc).__name__,
        },
        status_code=HTTPStatus.BAD_REQUEST,
    )


async def sqlalchemy_exception_handler(request, exc):
    return JSONResponse(
        content={
            "detail": str(exc)
            if settings.NODE_ENV != "production"
            else "Invalid request",
            "error_type": type(exc).__name__,
        },
        status_code=HTTPStatus.BAD_REQUEST,
    )


async def domain_exception_handler(request, exc):
    return JSONResponse(
        content={
            "detail": str(exc)
            if settings.NODE_ENV != "production"
            else "Invalid request",
            "error_type": type(exc).__name__,
        },
        status_code=HTTPStatus.BAD_REQUEST,
    )

async def universal_exception_handler(request, exc: Exception):
    return JSONResponse(
        content={
            "detail": str(exc) if settings.NODE_ENV != "production" else "Internal server error",
            "error_type": type(exc).__name__,
        },
        status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
    )