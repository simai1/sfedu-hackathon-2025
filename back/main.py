import uvicorn

from app.app import create_app
from app.core.config import settings
from app.core.logger import logger

application = create_app()

if __name__ == "__main__":
    logger.info("Starting server...")
    if settings.NODE_ENV == "production":
        uvicorn.run(
            "main:application",
            host=settings.APP_HOST,
            port=settings.APP_PORT,
            reload=False,
        )
    else:
        uvicorn.run(
            "main:application",
            host=settings.APP_HOST,
            port=settings.APP_PORT,
            reload=True,
            log_level="debug",
        )
