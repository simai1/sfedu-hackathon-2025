"""
Пример использования NeuroSensor WebSocket API

Этот скрипт демонстрирует, как подключиться к WebSocket API и получать данные
с датчиков BrainBit, включая определенные эмоции.
"""

import asyncio
import websockets
import json
import time


class NeuroSensorClient:
    def __init__(self, uri="ws://localhost:8766"):
        self.uri = uri
        self.websocket = None
        
    async def connect(self):
        """Подключение к WebSocket серверу"""
        try:
            self.websocket = await websockets.connect(self.uri)
            print(f"✅ Успешно подключено к {self.uri}")
            return True
        except Exception as e:
            print(f"❌ Ошибка подключения: {e}")
            return False
            
    async def disconnect(self):
        """Отключение от WebSocket сервера"""
        if self.websocket:
            await self.websocket.close()
            print("🔌 Отключено от сервера")
            
    async def receive_data(self, duration=30):
        """
        Получение данных от сервера
        
        Args:
            duration (int): Длительность получения данных в секундах
        """
        if not self.websocket:
            print("❌ Нет подключения к серверу")
            return
            
        print(f"📡 Начало приема данных на {duration} секунд...")
        start_time = time.time()
        
        try:
            while time.time() - start_time < duration:
                # Получаем сообщение от сервера
                message = await self.websocket.recv()
                data = json.loads(message)
                
                # Обрабатываем данные
                await self._process_data(data)
                
                # Небольшая задержка для лучшей читаемости
                await asyncio.sleep(0.1)
                
        except websockets.exceptions.ConnectionClosed:
            print("❌ Соединение закрыто сервером")
        except Exception as e:
            print(f"❌ Ошибка при получении данных: {e}")
            
    async def _process_data(self, data):
        """Обработка полученных данных"""
        data_type = data.get('type', 'unknown')
        
        if data_type == 'initial_data':
            print("\n🎯 Начальные данные получены")
        elif data_type == 'sensor_data':
            sensor_data = data.get('data', {})
            await self._display_sensor_info(sensor_data)
            
    async def _display_sensor_info(self, sensor_data):
        """Отображение информации с датчиков"""
        # Получаем время
        timestamp = time.strftime("%H:%M:%S")
        
        # Отображаем данные сенсора
        if sensor_data.get('sensor_data'):
            sd = sensor_data['sensor_data']
            print(f"\n[{timestamp}] 📊 Данные сенсора:")
            print(f"  O1: {sd['O1']:>7.2f}  O2: {sd['O2']:>7.2f}")
            print(f"  T3: {sd['T3']:>7.2f}  T4: {sd['T4']:>7.2f}")
        else:
            print(f"\n[{timestamp}] 📊 Данные сенсора: Нет данных")
            
        # Отображаем эмоции
        if sensor_data.get('emotion'):
            emotion = sensor_data['emotion']
            emotion_emoji = {
                'relaxed': '😌',
                'focused': '🧐',
                'anxious': '😰',
                'drowsy': '😴',
                'neutral': '😐'
            }
            emoji = emotion_emoji.get(emotion, '🤔')
            print(f"🎭 Эмулируемая эмоция: {emoji} {emotion}")
        else:
            print("🎭 Эмулируемая эмоция: Нет данных")
            
        # Отображаем ментальные данные
        if sensor_data.get('mental_data'):
            md = sensor_data['mental_data']
            print(f"🧠 Ментальные данные:")
            print(f"  Внимание:    {md['attention']:>5.1f}%")
            print(f"  Расслабление:{md['relaxation']:>5.1f}%")
            
            # Отображаем определенную эмоцию
            detected_emotion = md['detected_emotion']
            emotion_descriptions = {
                'расслабленное': '😌 Расслабленное состояние',
                'сосредоточенное': '🧐 Сосредоточенное состояние',
                'возбужденное': '🤩 Возбужденное состояние',
                'сонное': '😴 Сонное состояние',
                'нейтральное': '😐 Нейтральное состояние'
            }
            description = emotion_descriptions.get(detected_emotion, detected_emotion)
            print(f"  Определенная эмоция: {description}")
        else:
            print("🧠 Ментальные данные: Нет данных")
            
        # Отображаем спектральные данные
        if sensor_data.get('spectral_data'):
            sp = sensor_data['spectral_data']
            print(f"📊 Спектральные данные:")
            print(f"  δ (дельта):  {sp['delta']:>5.1f}%  🌙 Глубокий сон")
            print(f"  θ (тета):    {sp['theta']:>5.1f}%  🧘‍♀️ Медитация")
            print(f"  α (альфа):   {sp['alpha']:>5.1f}%  😌 Расслабление")
            print(f"  β (бета):    {sp['beta']:>5.1f}%  🧠 Активность")
            print(f"  γ (гамма):   {sp['gamma']:>5.1f}%  🔥 Интенсивность")


async def main():
    """Основная функция примера использования"""
    print("🚀 Пример использования NeuroSensor WebSocket API")
    print("=" * 50)
    
    # Создаем клиент
    client = NeuroSensorClient()
    
    # Подключаемся к серверу
    if await client.connect():
        try:
            # Получаем данные в течение 30 секунд
            await client.receive_data(duration=30)
        finally:
            # Отключаемся
            await client.disconnect()
            
    print("\n🏁 Пример завершен")


if __name__ == "__main__":
    # Запускаем асинхронную программу
    asyncio.run(main())