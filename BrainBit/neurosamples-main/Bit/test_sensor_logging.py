#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Тестовый скрипт для проверки логирования данных с датчиков
"""

import sys
import json
import time
from datetime import datetime
from PyQt6.QtWidgets import QApplication
from neuro_impl.sensor_emulator import create_sensor_emulator
from sensor_data_logger import SensorDataLogger, setup_sensor_with_logging


def test_sensor_data_logging():
    """Тест логирования данных с датчиков"""
    print("Запуск теста логирования данных с датчиков...")
    
    # Создаем QApplication (необходим для PyQt)
    app = QApplication(sys.argv)
    
    # Настраиваем сенсор с логированием
    logger = setup_sensor_with_logging(use_emulator=True)
    
    # Запускаем логирование
    logger.start_logging()
    
    # Запускаем эмулятор сигналов
    print("Запуск эмуляции сигналов...")
    
    # Ждем 15 секунд для сбора данных
    print("Сбор данных в течение 15 секунд...")
    try:
        time.sleep(15)
    except KeyboardInterrupt:
        print("\nПрервано пользователем")
    
    # Останавливаем логирование
    logger.stop_logging()
    
    print("Тест завершен.")


def parse_logged_data(log_file=None):
    """
    Парсинг залогированных данных (если они были сохранены в файл)
    """
    if log_file is None:
        print("Функция парсинга требует указания файла логов")
        return
    
    print(f"Парсинг данных из файла: {log_file}")
    
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                try:
                    data = json.loads(line.strip())
                    print(f"Строка {line_num}: {data['type']} - {data['timestamp']}")
                except json.JSONDecodeError as e:
                    print(f"Ошибка парсинга строки {line_num}: {e}")
    except FileNotFoundError:
        print(f"Файл {log_file} не найден")


if __name__ == "__main__":
    # Запуск теста
    test_sensor_data_logging()
    
    # Пример парсинга (если данные сохранялись в файл)
    # parse_logged_data("sensor_data.log")