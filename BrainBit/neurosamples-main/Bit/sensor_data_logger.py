import json
import time
from datetime import datetime
from PyQt6.QtCore import QObject, pyqtSignal
from neurosdk.cmn_types import SensorState, SensorInfo, SensorFamily, SensorCommand
from neuro_impl.brain_bit_controller import brain_bit_controller
from neuro_impl.sensor_emulator import create_sensor_emulator, create_emulator_sensor_info


class SensorDataLogger(QObject):
    """Класс для логирования данных с датчиков в консоль в формате JSON"""
    
    def __init__(self):
        super().__init__()
        self.is_logging = False
        self.setup_connections()
        
    def setup_connections(self):
        """Настройка соединений для получения данных от контроллера"""
        brain_bit_controller.resistReceived = self.on_resistance_data
        brain_bit_controller.signalReceived = self.on_signal_data
        
    def start_logging(self):
        """Запуск логирования данных"""
        self.is_logging = True
        print("Начало логирования данных с датчиков...")
        
    def stop_logging(self):
        """Остановка логирования данных"""
        self.is_logging = False
        print("Логирование данных остановлено.")
        
    def on_resistance_data(self, resist_data):
        """Обработка данных о сопротивлении"""
        if not self.is_logging:
            return
            
        # Создаем словарь с данными о сопротивлении
        resistance_data = {
            "timestamp": datetime.now().isoformat(),
            "type": "resistance",
            "data": {
                "O1": resist_data.O1 if resist_data.O1 != float('inf') else None,
                "O2": resist_data.O2 if resist_data.O2 != float('inf') else None,
                "T3": resist_data.T3 if resist_data.T3 != float('inf') else None,
                "T4": resist_data.T4 if resist_data.T4 != float('inf') else None
            }
        }
        
        # Выводим в консоль в формате JSON
        print(json.dumps(resistance_data, ensure_ascii=False))
        
    def on_signal_data(self, signal_data):
        """Обработка сигнальных данных"""
        if not self.is_logging:
            return
            
        # Обрабатываем последние 5 семплов для уменьшения объема данных
        recent_samples = signal_data[-5:] if len(signal_data) > 5 else signal_data
        
        # Создаем список значений для каждого канала
        o1_values = [sample.O1 for sample in recent_samples]
        o2_values = [sample.O2 for sample in recent_samples]
        t3_values = [sample.T3 for sample in recent_samples]
        t4_values = [sample.T4 for sample in recent_samples]
        
        # Создаем словарь с сигнальными данными
        signal_data_dict = {
            "timestamp": datetime.now().isoformat(),
            "type": "signal",
            "data": {
                "O1": o1_values,
                "O2": o2_values,
                "T3": t3_values,
                "T4": t4_values
            }
        }
        
        # Выводим в консоль в формате JSON
        print(json.dumps(signal_data_dict, ensure_ascii=False))
        
    def log_emotion_data(self, emotion_type, attention, relaxation, spectral_data=None):
        """Логирование данных об эмоциях"""
        if not self.is_logging:
            return
            
        # Создаем словарь с данными об эмоциях
        emotion_data = {
            "timestamp": datetime.now().isoformat(),
            "type": "emotion",
            "data": {
                "emotion_type": emotion_type,
                "attention": attention,
                "relaxation": relaxation,
                "spectral": spectral_data if spectral_data else {}
            }
        }
        
        # Выводим в консоль в формате JSON
        print(json.dumps(emotion_data, ensure_ascii=False))


def setup_sensor_with_logging(use_emulator=True):
    """Настройка сенсора с логированием данных"""
    logger = SensorDataLogger()
    
    if use_emulator:
        # Используем эмулятор
        print("Используется эмулятор датчика")
        emulator = create_sensor_emulator()
        brain_bit_controller.set_emulator(emulator)
    else:
        # Здесь будет код для подключения к реальному устройству
        print("Подготовка к подключению реального устройства")
        # Пока оставим заглушку
        pass
    
    return logger


if __name__ == "__main__":
    # Пример использования
    logger = setup_sensor_with_logging(use_emulator=True)
    
    # Запуск логирования
    logger.start_logging()
    
    # Здесь можно добавить код для запуска сигналов/сопротивления
    # Например:
    # brain_bit_controller.start_resist()
    # brain_bit_controller.start_signal()
    
    # Для примера просто ждем 10 секунд
    print("Логирование активно. Нажмите Ctrl+C для остановки.")
    try:
        time.sleep(10)
    except KeyboardInterrupt:
        pass
    finally:
        logger.stop_logging()