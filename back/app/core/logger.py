import logging
import sys

from colorlog import ColoredFormatter

from app.core.config import settings

logger = logging.getLogger("app")
logger.setLevel(logging.DEBUG if settings.NODE_ENV != "production" else logging.INFO)

formatter = ColoredFormatter(
    "%(log_color)s%(levelname)s:%(reset)s     %(message)s",
    log_colors={
        "DEBUG": "cyan",
        "INFO": "light_green",
        "WARNING": "yellow",
        "ERROR": "red",
        "CRITICAL": "bold_red",
    },
    reset=True,
)

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)
