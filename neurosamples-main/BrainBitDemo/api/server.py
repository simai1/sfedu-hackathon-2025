import asyncio
import websockets
import json
import threading
import time
import sys
import os

# Добавляем путь к родительской директории для импорта модулей
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, Any
from neuro_impl.sensor_emulator import create_sensor_emulator
from neuro_impl.emotions_bipolar_controller import EmotionBipolar
from neurosdk.cmn_types import SensorState, SensorCommand


class SensorAPIServer:
    def __init__(self, host="localhost", port=8766):
        self.host = host
        self.port = port
        self.emulator = create_sensor_emulator()
        self.emotion_controller = EmotionBipolar()
        self.clients = set()
        self.setup_connections()
        self.setup_emotion_callbacks()
        
        # Данные для отправки клиентам
        self.current_data = {
            "sensor_data": None,
            "emotion": None,
            "mental_data": None,
            "spectral_data": None
        }
        
    def setup_connections(self):
        """Настройка соединений для получения данных от эмулятора"""
        self.emulator.sensorStateChanged.connect(self.on_sensor_state_changed)
        self.emulator.signalDataReceived.connect(self.on_signal_received)
        self.emulator.resistDataReceived.connect(self.on_resist_received)
        
    def setup_emotion_callbacks(self):
        """Настройка обратных вызовов для контроллера эмоций"""
        self.emotion_controller.progressCalibrationCallback = self.on_calibration_progress
        self.emotion_controller.isArtifactedSequenceCallback = self.on_artifacted_sequence
        self.emotion_controller.isBothSidesArtifactedCallback = self.on_both_sides_artifacted
        self.emotion_controller.lastMindDataCallback = self.on_mind_data
        self.emotion_controller.lastSpectralDataCallback = self.on_spectral_data
        self.emotion_controller.rawSpectralDataCallback = self.on_raw_spectral_data
        
        # Добавляем периодическую проверку данных
        self.__data_check_counter = 0
        
    def on_sensor_state_changed(self, sensor, state):
        """Обработчик изменения состояния сенсора"""
        print(f"Состояние сенсора изменено: {state}")
        
    def on_signal_received(self, sensor, data):
        """Обработчик получения сигнальных данных"""
        if len(data) > 0:
            sample = data[0]
            # Сохраняем последние данные сенсора
            self.current_data["sensor_data"] = {
                "O1": float(sample.O1),
                "O2": float(sample.O2),
                "T3": float(sample.T3),
                "T4": float(sample.T4),
                "timestamp": time.time()
            }
            
            # Получаем текущую эмоцию из эмулятора
            self.current_data["emotion"] = self.emulator.get_current_emotion()
            
            # Передаем данные в контроллер эмоций для обработки
            self.emotion_controller.process_data(data)
            
            # Выводим отладочную информацию
            print(f"Получены данные сенсора: O1={sample.O1:.2f}, O2={sample.O2:.2f}, T3={sample.T3:.2f}, T4={sample.T4:.2f}")
                
    def on_resist_received(self, sensor, data):
        """Обработчик получения данных о сопротивлении"""
        print(f"Сопротивление - O1: {data.O1}, O2: {data.O2}, T3: {data.T3}, T4: {data.T4}")
        
    def on_calibration_progress(self, progress):
        """Обработчик прогресса калибровки"""
        print(f"Прогресс калибровки: {progress}%")
        
    def on_artifacted_sequence(self, artifacted):
        """Обработчик артефактов последовательности"""
        print(f"Артефакты последовательности: {artifacted}")
        
    def on_both_sides_artifacted(self, artifacted):
        """Обработчик артефактов с обеих сторон"""
        print(f"Артефакты с обеих сторон: {artifacted}")
        
    def on_mind_data(self, data):
        """Обработчик ментальных данных"""
        print(f"Получены ментальные данные: {data}")
        try:
            # Определяем эмоцию на основе ментальных данных
            attention = float(getattr(data, 'rel_attention', 0))
            relaxation = float(getattr(data, 'rel_relaxation', 0))
            
            # Простая логика определения эмоции
            if relaxation > 60 and attention < 40:
                detected_emotion = "расслабленное"
            elif attention > 60 and relaxation < 40:
                detected_emotion = "сосредоточенное"
            elif attention > 50 and relaxation > 50:
                detected_emotion = "возбужденное"
            elif attention < 30 and relaxation < 30:
                detected_emotion = "сонное"
            else:
                detected_emotion = "нейтральное"
                
            # Сохраняем ментальные данные
            self.current_data["mental_data"] = {
                "attention": attention,
                "relaxation": relaxation,
                "detected_emotion": detected_emotion,
                "emulated_emotion": self.emulator.get_current_emotion()
            }
            print(f"Обновлены ментальные данные: {self.current_data['mental_data']}")
        except Exception as e:
            print(f"Ошибка обработки ментальных данных: {e}")
            # Даже в случае ошибки пытаемся сохранить базовые данные
            try:
                self.current_data["mental_data"] = {
                    "attention": 0,
                    "relaxation": 0,
                    "detected_emotion": "неизвестно",
                    "emulated_emotion": self.emulator.get_current_emotion()
                }
            except:
                pass
        
    def on_spectral_data(self, spectral_data):
        """Обработчик спектральных данных"""
        print(f"Получены спектральные данные: {spectral_data}")
        try:
            # Сохраняем спектральные данные
            self.current_data["spectral_data"] = {
                "delta": float(getattr(spectral_data, 'delta', 0) * 100),
                "theta": float(getattr(spectral_data, 'theta', 0) * 100),
                "alpha": float(getattr(spectral_data, 'alpha', 0) * 100),
                "beta": float(getattr(spectral_data, 'beta', 0) * 100),
                "gamma": float(getattr(spectral_data, 'gamma', 0) * 100)
            }
            print(f"Обновлены спектральные данные: {self.current_data['spectral_data']}")
        except Exception as e:
            print(f"Ошибка обработки спектральных данных: {e}")
            # Даже в случае ошибки пытаемся сохранить базовые данные
            try:
                self.current_data["spectral_data"] = {
                    "delta": 0,
                    "theta": 0,
                    "alpha": 0,
                    "beta": 0,
                    "gamma": 0
                }
            except:
                pass
        
    def on_raw_spectral_data(self, spect_vals):
        """Обработчик сырых спектральных данных"""
        print(f"Сырые спектральные данные - Альфа: {getattr(spect_vals, 'alpha', 0):.2f}, Бета: {getattr(spect_vals, 'beta', 0):.2f}")
        
    async def register_client(self, websocket):
        """Регистрация нового клиента"""
        self.clients.add(websocket)
        print(f"Новый клиент подключен. Всего клиентов: {len(self.clients)}")
        
        # Отправляем начальные данные клиенту
        try:
            serialized_data = self._serialize_data(self.current_data)
            print(f"Сериализованные данные: {serialized_data}")
            message = {
                "type": "initial_data",
                "data": serialized_data
            }
            print(f"Отправляемое сообщение: {message}")
            await websocket.send(json.dumps(message, ensure_ascii=False))
            print("Сообщение успешно отправлено")
        except websockets.exceptions.ConnectionClosed:
            print("Соединение закрыто при отправке данных")
        except Exception as e:
            print(f"Ошибка отправки данных клиенту: {e}")
            import traceback
            traceback.print_exc()
        
    def _serialize_data(self, data):
        """Сериализация данных для отправки по WebSocket"""
        serialized = {}
        for key, value in data.items():
            if value is None:
                serialized[key] = None
            elif isinstance(value, dict):
                serialized[key] = self._serialize_data(value)
            elif isinstance(value, (int, float, str, bool)):
                serialized[key] = value
            else:
                serialized[key] = str(value)
        return serialized
        
    async def unregister_client(self, websocket):
        """Удаление клиента"""
        self.clients.discard(websocket)
        print(f"Клиент отключен. Всего клиентов: {len(self.clients)}")
        
    async def send_data_to_clients(self):
        """Отправка данных всем подключенным клиентам"""
        if not self.clients:
            return
            
        # Периодически проверяем наличие данных от контроллера
        self.__data_check_counter += 1
        if self.__data_check_counter % 50 == 0:  # Проверяем каждые 50 циклов
            # Если данные отсутствуют, пытаемся получить их принудительно
            if not self.current_data["mental_data"] or not self.current_data["spectral_data"]:
                print("Принудительная проверка данных от контроллера")
                # Здесь можно добавить дополнительную логику, если необходимо
                
        # Формируем сообщение с текущими данными
        message = {
            "type": "sensor_data",
            "data": self._serialize_data(self.current_data)
        }
        
        # Отправляем сообщение всем клиентам
        disconnected_clients = set()
        for client in self.clients:
            try:
                await client.send(json.dumps(message, ensure_ascii=False))
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.add(client)
            except Exception as e:
                print(f"Ошибка отправки данных клиенту: {e}")
                disconnected_clients.add(client)
                
        # Удаляем отключенных клиентов
        for client in disconnected_clients:
            self.clients.discard(client)
            
    async def handle_client(self, websocket):
        """Обработка подключения клиента"""
        await self.register_client(websocket)
        try:
            async for message in websocket:
                # Обработка входящих сообщений от клиента (если нужно)
                try:
                    data = json.loads(message)
                    print(f"Получено сообщение от клиента: {data}")
                except json.JSONDecodeError:
                    print("Ошибка декодирования JSON от клиента")
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            print(f"Ошибка обработки клиента: {e}")
        finally:
            await self.unregister_client(websocket)
            
    async def start_sensor(self):
        """Запуск сенсора"""
        # Подключаемся к эмулятору
        print("Подключение к эмулятору...")
        self.emulator.connect()
        await asyncio.sleep(1)
        
        # Запускаем измерение сопротивления
        print("Запуск измерения сопротивления...")
        self.emulator.start_resist()
        await asyncio.sleep(3)
        self.emulator.stop_resist()
        
        # Начинаем калибровку через контроллер эмоций
        print("Начало калибровки через контроллер эмоций...")
        self.emotion_controller.start_calibration()
        
        # Запускаем сигнал
        print("Запуск сигнала...")
        self.emulator.start_signal()
        
    async def stop_sensor(self):
        """Остановка сенсора"""
        self.emulator.stop_signal()
        print("Сенсор остановлен")
        
    async def run_server(self):
        """Запуск WebSocket сервера"""
        print(f"Запуск WebSocket сервера на {self.host}:{self.port}")
        
        # Запускаем сенсор в отдельной задаче
        asyncio.create_task(self.start_sensor())
        
        # Создаем WebSocket сервер
        async with websockets.serve(self.handle_client, self.host, self.port):
            # Основной цикл отправки данных клиентам
            while True:
                await self.send_data_to_clients()
                await asyncio.sleep(0.1)  # Отправляем данные каждые 100 мс


def main():
    """Основная функция для запуска сервера"""
    server = SensorAPIServer()
    
    # Запускаем сервер
    try:
        asyncio.run(server.run_server())
    except KeyboardInterrupt:
        print("Сервер остановлен")


if __name__ == "__main__":
    main()