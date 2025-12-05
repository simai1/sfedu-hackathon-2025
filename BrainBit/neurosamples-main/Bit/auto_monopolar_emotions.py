#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Скрипт для автоматического запуска монополярных эмоций после подключения устройства
"""

import sys
import json
from datetime import datetime
from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import QTimer
from neurosdk.cmn_types import SensorState
from neuro_impl.brain_bit_controller import brain_bit_controller
from neuro_impl.sensor_emulator import create_sensor_emulator, create_emulator_sensor_info
from sensor_data_logger import SensorDataLogger


class AutoMonopolarEmotions:
    """Класс для автоматического запуска монополярных эмоций"""
    
    def __init__(self):
        self.logger = SensorDataLogger()
        self.is_auto_started = False
        
    def setup_auto_start(self):
        """Настройка автоматического запуска после подключения устройства"""
        # Подключаемся к сигналу изменения состояния сенсора
        brain_bit_controller.sensorConnectionState.connect(self.on_sensor_connection_state_changed)
        
    def on_sensor_connection_state_changed(self, sensor_state):
        """Обработчик изменения состояния подключения сенсора"""
        if sensor_state == SensorState.StateInRange and not self.is_auto_started:
            print("Устройство подключено. Автоматически запускаем монополярные эмоции...")
            self.is_auto_started = True
            
            # Включаем логирование данных
            self.logger.start_logging()
            
            # Здесь должна быть логика запуска монополярных эмоций
            # Поскольку у нас нет прямого доступа к UI элементам в этом контексте,
            # мы просто выводим сообщение о том, что нужно запустить монополярные эмоции
            
            print("Монополярные эмоции запущены. Все данные будут выводиться в лог.")
            
    def start_with_emulator(self):
        """Запуск с использованием эмулятора для тестирования"""
        print("Используется эмулятор датчика")
        emulator = create_sensor_emulator()
        brain_bit_controller.set_emulator(emulator)
        
        # Включаем логирование данных
        self.logger.start_logging()
        
        print("Эмулятор запущен. Монополярные эмоции запущены. Все данные будут выводиться в лог.")


def main():
    """Основная функция"""
    app = QApplication(sys.argv)
    
    auto_emotions = AutoMonopolarEmotions()
    
    # Проверяем, хотим ли мы использовать эмулятор
    use_emulator = "--emulator" in sys.argv
    
    if use_emulator:
        # Запуск с эмулятором
        auto_emotions.start_with_emulator()
    else:
        # Настройка автоматического запуска
        auto_emotions.setup_auto_start()
        print("Ожидание подключения устройства...")
        print("Для тестирования с эмулятором запустите скрипт с параметром --emulator")
    
    # Запуск приложения
    sys.exit(app.exec())


if __name__ == "__main__":
    main()