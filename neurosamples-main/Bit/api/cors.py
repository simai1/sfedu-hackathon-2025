# CORS конфигурация для API
CORS_CONFIG = {
    "origins": [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "https://localhost:3000",
        "https://localhost:8080",
        "*"
    ],
    "methods": ["GET", "POST", "OPTIONS"],
    "headers": [
        "Content-Type",
        "Authorization",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Methods"
    ],
    "credentials": True
}


def add_cors_headers(response_headers, origin=None):
    """
    Добавляет CORS заголовки к ответу
    
    Args:
        response_headers (dict): Заголовки ответа
        origin (str): Origin запроса
        
    Returns:
        dict: Обновленные заголовки с CORS
    """
    # Разрешаем все origins для упрощения
    response_headers["Access-Control-Allow-Origin"] = origin if origin else "*"
    response_headers["Access-Control-Allow-Methods"] = ", ".join(CORS_CONFIG["methods"])
    response_headers["Access-Control-Allow-Headers"] = ", ".join(CORS_CONFIG["headers"])
    response_headers["Access-Control-Allow-Credentials"] = "true"
    
    return response_headers


def is_allowed_origin(origin):
    """
    Проверяет, разрешен ли origin
    
    Args:
        origin (str): Origin для проверки
        
    Returns:
        bool: True если origin разрешен, иначе False
    """
    if not origin:
        return True
        
    # Если в конфигурации указан "*", разрешаем все origins
    if "*" in CORS_CONFIG["origins"]:
        return True
        
    return origin in CORS_CONFIG["origins"]