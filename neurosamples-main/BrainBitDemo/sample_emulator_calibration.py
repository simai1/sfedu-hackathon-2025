import sys
import time
from PyQt6.QtWidgets import QApplication
from neuro_impl.sensor_emulator import create_sensor_emulator
from neurosdk.cmn_types import SensorState, SensorCommand


class EmulatorCalibrationDemo:
    def __init__(self):
        self.emulator = create_sensor_emulator()
        self.setup_connections()
        
    def setup_connections(self):
        """Настройка соединений для получения данных от эмулятора"""
        self.emulator.sensorStateChanged.connect(self.on_sensor_state_changed)
        self.emulator.signalDataReceived.connect(self.on_signal_received)
        self.emulator.resistDataReceived.connect(self.on_resist_received)
        
    def on_sensor_state_changed(self, sensor, state):
        """Обработчик изменения состояния сенсора"""
        print(f"Состояние сенсора изменено: {state}")
        
    def on_signal_received(self, sensor, data):
        """Обработчик получения сигнальных данных"""
        if len(data) > 0:
            sample = data[0]
            print(f"Получены сигнальные данные - O1: {sample.O1:.2f}, O2: {sample.O2:.2f}, T3: {sample.T3:.2f}, T4: {sample.T4:.2f}")
            
            # Проверяем статус калибровки
            if self.emulator.is_calibrating():
                progress = self.emulator.get_calibration_progress()
                print(f"Идет калибровка: {progress}%")
                
    def on_resist_received(self, sensor, data):
        """Обработчик получения данных о сопротивлении"""
        print(f"Сопротивление - O1: {data.O1}, O2: {data.O2}, T3: {data.T3}, T4: {data.T4}")
        
    def run_demo(self):
        """Запуск демонстрации калибровки эмулятора"""
        print("=== Демонстрация калибровки эмулятора ===")
        
        # Подключаемся к эмулятору
        print("Подключение к эмулятору...")
        self.emulator.connect()
        time.sleep(1)
        
        # Запускаем измерение сопротивления
        print("Запуск измерения сопротивления...")
        self.emulator.start_resist()
        time.sleep(3)
        self.emulator.stop_resist()
        
        # Запускаем сигнал
        print("Запуск сигнала...")
        self.emulator.start_signal()
        time.sleep(2)
        
        # Начинаем калибровку
        print("Начало калибровки...")
        self.emulator.start_calibration()
        
        # Ждем завершения калибровки
        while self.emulator.is_calibrating():
            progress = self.emulator.get_calibration_progress()
            print(f"Прогресс калибровки: {progress}%")
            time.sleep(1)
            
        print("Калибровка завершена!")
        
        # Останавливаем сигнал
        self.emulator.stop_signal()
        print("Демонстрация завершена")


def main():
    app = QApplication(sys.argv)
    demo = EmulatorCalibrationDemo()
    demo.run_demo()
    app.quit()


if __name__ == "__main__":
    main()