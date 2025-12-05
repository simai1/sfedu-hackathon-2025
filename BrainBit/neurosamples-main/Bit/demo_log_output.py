#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Демонстрационный скрипт для показа формата логов данных с датчиков
"""

import json
import time
from datetime import datetime


def demo_log_output():
    """Демонстрация формата логов данных с датчиков"""
    
    print("=== Демонстрация формата логов данных с датчиков ===\n")
    
    # Пример данных о сопротивлении
    resistance_data = {
        "timestamp": datetime.now().isoformat(),
        "type": "resistance",
        "data": {
            "O1": 1500.0,
            "O2": 2500.0,
            "T3": 4500.0,
            "T4": 1800.0
        }
    }
    
    print("1. Данные о сопротивлении:")
    print(json.dumps(resistance_data, ensure_ascii=False, indent=2))
    print()
    
    # Пример сигнальных данных
    signal_data = {
        "timestamp": datetime.now().isoformat(),
        "type": "signal",
        "data": {
            "O1": [15.2, 16.1, 14.8, 15.5, 16.0],
            "O2": [14.8, 15.5, 16.2, 15.0, 14.7],
            "T3": [16.0, 15.8, 16.5, 15.2, 15.9],
            "T4": [15.5, 16.2, 15.8, 16.1, 15.4]
        }
    }
    
    print("2. Сигнальные данные:")
    print(json.dumps(signal_data, ensure_ascii=False, indent=2))
    print()
    
    # Пример данных об эмоциях
    emotion_data = {
        "timestamp": datetime.now().isoformat(),
        "type": "emotion",
        "data": {
            "emotion_type": "monopolar_O1",
            "attention": 65.4,
            "relaxation": 34.6,
            "spectral": {
                "delta": 0.15,
                "theta": 0.25,
                "alpha": 0.35,
                "beta": 0.20,
                "gamma": 0.05
            }
        }
    }
    
    print("3. Данные об эмоциях:")
    print(json.dumps(emotion_data, ensure_ascii=False, indent=2))
    print()
    
    # Пример спектральных данных
    spectrum_data = {
        "timestamp": datetime.now().isoformat(),
        "type": "spectrum",
        "data": {
            "channel": "O1",
            "frequency_bands": {
                "delta": [0.1, 0.2, 0.15, 0.18, 0.12],
                "theta": [0.3, 0.25, 0.28, 0.32, 0.27],
                "alpha": [0.4, 0.35, 0.38, 0.42, 0.37],
                "beta": [0.15, 0.2, 0.18, 0.22, 0.19],
                "gamma": [0.05, 0.05, 0.04, 0.06, 0.05]
            }
        }
    }
    
    print("4. Спектральные данные:")
    print(json.dumps(spectrum_data, ensure_ascii=False, indent=2))
    print()
    
    print("=== Конец демонстрации ===")


if __name__ == "__main__":
    demo_log_output()