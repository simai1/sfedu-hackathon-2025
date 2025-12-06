from app.service.connection_manager import ConnectionManager

# use a single manager instance so device and client sockets share state
connection_manager = ConnectionManager()


async def get_service():
    return connection_manager
