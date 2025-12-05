import asyncio
import websockets
import json


async def simple_client():
    uri = "ws://localhost:8766"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Подключено к {uri}")
            
            # Получаем 20 сообщений
            for i in range(20):
                message = await websocket.recv()
                data = json.loads(message)
                
                print(f"\n=== Сообщение {i+1} ===")
                print(f"Тип: {data['type']}")
                
                if data['type'] in ['sensor_data', 'initial_data']:
                    sensor_data = data['data']
                    
                    # Выводим данные сенсора
                    if sensor_data['sensor_data']:
                        sd = sensor_data['sensor_data']
                        print(f"Сенсор O1: {sd['O1']:.2f}, O2: {sd['O2']:.2f}, T3: {sd['T3']:.2f}, T4: {sd['T4']:.2f}")
                    else:
                        print("Сенсор: Нет данных")
                    
                    # Выводим эмоции
                    if sensor_data['emotion']:
                        print(f"Эмулируемая эмоция: {sensor_data['emotion']}")
                    else:
                        print("Эмулируемая эмоция: Нет данных")
                        
                    # Выводим ментальные данные
                    if sensor_data['mental_data']:
                        md = sensor_data['mental_data']
                        print(f"Внимание: {md['attention']:.2f}%, Расслабление: {md['relaxation']:.2f}%")
                        print(f"Определенная эмоция: {md['detected_emotion']}")
                    else:
                        print("Ментальные данные: Нет данных")
                        
                    # Выводим спектральные данные
                    if sensor_data['spectral_data']:
                        sp = sensor_data['spectral_data']
                        print(f"Спектральные данные:")
                        print(f"  Дельта: {sp['delta']:.2f}%")
                        print(f"  Тета: {sp['theta']:.2f}%")
                        print(f"  Альфа: {sp['alpha']:.2f}%")
                        print(f"  Бета: {sp['beta']:.2f}%")
                        print(f"  Гамма: {sp['gamma']:.2f}%")
                    else:
                        print("Спектральные данные: Нет данных")
                
    except Exception as e:
        print(f"Ошибка: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(simple_client())