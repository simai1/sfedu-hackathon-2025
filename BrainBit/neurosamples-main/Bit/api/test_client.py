import asyncio
import websockets
import json


async def test_client():
    uri = "ws://localhost:8766"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Подключено к {uri}")
            
            # Получаем сообщения от сервера
            message_count = 0
            while message_count < 20:  # Получаем 20 сообщений
                try:
                    message = await websocket.recv()
                    data = json.loads(message)
                    message_count += 1
                    
                    print(f"Получено сообщение #{message_count}:")
                    print(f"  Тип: {data['type']}")
                    
                    if data['type'] in ['sensor_data', 'initial_data']:
                        sensor_data = data['data']
                        print(f"  Данные сенсора: {sensor_data.get('sensor_data', 'N/A')}")
                        print(f"  Эмоция: {sensor_data.get('emotion', 'N/A')}")
                        print(f"  Ментальные данные: {sensor_data.get('mental_data', 'N/A')}")
                        print(f"  Спектральные данные: {sensor_data.get('spectral_data', 'N/A')}")
                    print()
                    
                except json.JSONDecodeError:
                    print("Ошибка декодирования JSON")
                except Exception as e:
                    print(f"Ошибка обработки сообщения: {e}")
                
    except Exception as e:
        print(f"Ошибка подключения: {e}")


if __name__ == "__main__":
    asyncio.run(test_client())