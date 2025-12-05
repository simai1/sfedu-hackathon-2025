from app.service.token_service import TokenService


async def get_service():
    return TokenService()