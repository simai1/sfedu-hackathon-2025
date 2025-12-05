from app.service.connection_manager import ConnectionManager

async def get_service():
    return ConnectionManager()