#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Тестовый скрипт для демонстрации автоматического запуска монополярных эмоций
"""

import sys
import time
from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import QTimer
from neurosdk.cmn_types import SensorState
from neuro_impl.brain_bit_controller import brain_bit_controller
from neuro_impl.sensor_emulator import create_sensor_emulator
from sensor_data_logger import SensorDataLogger


def simulate_device_connection():
    """Симуляция подключения устройства"""
    print("Симуляция поиска устройств...")
    print("Найдено устройство: BrainBit Emulator (EMUL-001)")
    print("Подключение к устройству...")
    
    # Создаем эмулятор устройства
    emulator = create_sensor_emulator()
    
    # Устанавливаем эмулятор в контроллер
    brain_bit_controller.set_emulator(emulator)
    
    # Симулируем изменение состояния подключения
    brain_bit_controller.sensorConnectionState.emit(SensorState.StateInRange)
    
    print("Устройство успешно подключено!")


def main():
    """Основная функция"""
    print("=== Тест автоматического запуска монополярных эмоций ===")
    print()
    
    app = QApplication(sys.argv)
    
    # Создаем логгер
    logger = SensorDataLogger()
    
    # Симулируем подключение устройства через 2 секунды
    QTimer.singleShot(2000, simulate_device_connection)
    
    print("Ожидание подключения устройства...")
    print("После подключения автоматически запустится режим монополярных эмоций")
    print("и начнется логирование всех данных с датчиков.")
    print()
    
    # Запуск приложения
    sys.exit(app.exec())


if __name__ == "__main__":
    main()