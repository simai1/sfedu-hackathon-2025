import random
import time
import math
from threading import Thread
from neurosdk.cmn_types import SensorState, SensorInfo, SensorFamily, SensorCommand
from PyQt6.QtCore import QObject, pyqtSignal


class SensorData:
    def __init__(self, O1=0, O2=0, T3=0, T4=0):
        self.O1 = O1
        self.O2 = O2
        self.T3 = T3
        self.T4 = T4


class ResistData:
    def __init__(self, O1=float('inf'), O2=float('inf'), T3=float('inf'), T4=float('inf')):
        self.O1 = O1
        self.O2 = O2
        self.T3 = T3
        self.T4 = T4


class SensorEmulator(QObject):
    sensorStateChanged = pyqtSignal(object, object)  # sensor, state
    batteryChanged = pyqtSignal(object, int)  # sensor, battery_level
    signalDataReceived = pyqtSignal(object, list)  # sensor, data
    resistDataReceived = pyqtSignal(object, ResistData)  # sensor, data

    def __init__(self):
        super().__init__()
        self.__is_connected = False
        self.__is_signal_started = False
        self.__is_resist_started = False
        self.__battery_level = 100
        self.__signal_thread = None
        self.__resist_thread = None
        self.__commands_supported = [SensorCommand.StartSignal, SensorCommand.StopSignal, 
                                   SensorCommand.StartResist, SensorCommand.StopResist]
        
        # Добавляем поддержку эмоций
        self.__current_emotion = "neutral"  # Текущая эмоция
        self.__emotion_patterns = {
            "neutral": {"alpha": 50, "beta": 30, "theta": 20, "delta": 10},
            "relaxed": {"alpha": 70, "beta": 20, "theta": 25, "delta": 15},
            "focused": {"alpha": 40, "beta": 50, "theta": 15, "delta": 5},
            "anxious": {"alpha": 30, "beta": 60, "theta": 30, "delta": 10},
            "drowsy": {"alpha": 40, "beta": 20, "theta": 25, "delta": 30}
        }
        self.__emotion_cycle = ["neutral", "relaxed", "focused", "anxious", "drowsy"]
        self.__emotion_index = 0
        self.__sample_count = 0

    def connect(self):
        """Эмуляция подключения к сенсору"""
        self.__is_connected = True
        self.sensorStateChanged.emit(self, SensorState.StateInRange)
        # Эмуляция изменения уровня батареи
        self.batteryChanged.emit(self, self.__battery_level)

    def disconnect(self):
        """Эмуляция отключения от сенсора"""
        self.__is_connected = False
        self.__stop_signal()
        self.__stop_resist()
        self.sensorStateChanged.emit(self, SensorState.StateOutOfRange)

    @property
    def state(self):
        """Возвращает состояние сенсора"""
        return SensorState.StateInRange if self.__is_connected else SensorState.StateOutOfRange

    @property
    def Name(self):
        """Возвращает имя сенсора"""
        return "BrainBit Emulator"

    @property
    def SerialNumber(self):
        """Возвращает серийный номер сенсора"""
        return "EMUL-001"
        
    @property
    def Address(self):
        """Возвращает адрес сенсора"""
        return "EMULATOR-001"

    @property
    def BattPower(self):
        """Возвращает уровень заряда батареи"""
        return self.__battery_level

    def is_supported_feature(self, feature):
        """Проверяет, поддерживается ли функция"""
        # Для простоты будем считать, что все функции поддерживаются
        return True

    def is_supported_command(self, command):
        """Проверяет, поддерживается ли команда"""
        return command in self.__commands_supported

    def exec_command(self, command):
        """Эмуляция выполнения команды"""
        if command == SensorCommand.StartSignal:
            self.start_signal()
        elif command == SensorCommand.StopSignal:
            self.stop_signal()
        elif command == SensorCommand.StartResist:
            self.start_resist()
        elif command == SensorCommand.StopResist:
            self.stop_resist()
        else:
            pass

    def start_signal(self):
        """Запуск эмуляции сигнала"""
        if not self.__is_signal_started:
            self.__is_signal_started = True
            self.__signal_thread = Thread(target=self.__generate_signal_data)
            self.__signal_thread.daemon = True
            self.__signal_thread.start()
            return True
        return False

    def stop_signal(self):
        """Остановка эмуляции сигнала"""
        self.__stop_signal()

    def start_resist(self):
        """Запуск эмуляции сопротивления"""
        if not self.__is_resist_started:
            self.__is_resist_started = True
            self.__resist_thread = Thread(target=self.__generate_resist_data)
            self.__resist_thread.daemon = True
            self.__resist_thread.start()
            return True
        return False

    def stop_resist(self):
        """Остановка эмуляции сопротивления"""
        self.__stop_resist()

    def __stop_signal(self):
        """Остановка потока сигнала"""
        self.__is_signal_started = False
        if self.__signal_thread and self.__signal_thread.is_alive():
            self.__signal_thread.join(timeout=1)

    def __stop_resist(self):
        """Остановка потока сопротивления"""
        self.__is_resist_started = False
        if self.__resist_thread and self.__resist_thread.is_alive():
            self.__resist_thread.join(timeout=1)

    def get_current_emotion(self):
        """Получение текущей эмулируемой эмоции"""
        return self.__current_emotion

    def __generate_signal_data(self):
        """Генерация реалистичных данных сигнала с волнами альфа, бета и т.д."""
        # Временная переменная для генерации волн
        t = 0
        sample_count = 0
        while self.__is_signal_started:
            # Меняем эмоцию каждые 500 семплов
            if self.__sample_count % 500 == 0:
                self.__emotion_index = (self.__emotion_index + 1) % len(self.__emotion_cycle)
                self.__current_emotion = self.__emotion_cycle[self.__emotion_index]
                print(f"Эмулятор: Текущая эмоция - {self.__current_emotion}")
            
            # Получаем паттерн для текущей эмоции
            pattern = self.__emotion_patterns[self.__current_emotion]
            
            # Генерируем данные с различными волнами
            signal_data = []
            for _ in range(25):  # 25 семплов за раз
                # Создаем комбинацию различных волн на основе текущей эмоции
                alpha_wave = pattern["alpha"] * math.sin(2 * math.pi * 10 * t)
                beta_wave = pattern["beta"] * math.sin(2 * math.pi * 20 * t)
                theta_wave = pattern["theta"] * math.sin(2 * math.pi * 6 * t)
                delta_wave = pattern["delta"] * math.sin(2 * math.pi * 2 * t)
                
                # Добавляем меньший шум для реалистичности
                noise = random.uniform(-5, 5)
                
                # Комбинируем волны для каждого канала с небольшими вариациями
                data = SensorData(
                    O1=alpha_wave + beta_wave * 0.5 + theta_wave * 0.3 + delta_wave * 0.1 + noise,
                    O2=alpha_wave * 0.9 + beta_wave * 0.6 + theta_wave * 0.2 + delta_wave * 0.15 + noise,
                    T3=alpha_wave * 0.8 + beta_wave * 0.7 + theta_wave * 0.25 + delta_wave * 0.12 + noise,
                    T4=alpha_wave * 0.85 + beta_wave * 0.55 + theta_wave * 0.35 + delta_wave * 0.08 + noise
                )
                signal_data.append(data)
                t += 0.004  # При частоте дискретизации 250 Гц, шаг времени 1/250 = 0.004 сек
                self.__sample_count += 1
            
            # Выводим отладочную информацию каждые 100 семплов
            sample_count += len(signal_data)
            if sample_count % 100 == 0:
                print(f"Emulator: Generated {sample_count} samples, emotion: {self.__current_emotion}, latest values - O1: {signal_data[-1].O1:.2f}, O2: {signal_data[-1].O2:.2f}, T3: {signal_data[-1].T3:.2f}, T4: {signal_data[-1].T4:.2f}")
            
            # Эмитируем сигнал с данными
            self.signalDataReceived.emit(self, signal_data)
            
            # Ждем немного, чтобы имитировать частоту_samplingа
            time.sleep(0.1)

    def __generate_resist_data(self):
        """Генерация реалистичных данных сопротивления"""
        while self.__is_resist_started:
            # Генерируем реалистичные значения сопротивления
            # Хороший контакт: 1000-5000 Ом
            # Плохой контакт: 10000-100000 Ом
            # Отсутствие контакта: бесконечность
            
            resist_data = ResistData(
                O1=random.uniform(1000, 5000),  # Хороший контакт
                O2=random.uniform(2000, 10000), # Средний контакт
                T3=random.uniform(5000, 50000), # Плохой контакт
                T4=random.uniform(1000, 8000)   # Хороший/средний контакт
            )
            
            # Иногда имитируем плохой контакт или отсутствие контакта
            if random.random() < 0.1:  # 10% вероятность
                resist_data.O1 = float('inf')  # Отсутствие контакта
            
            if random.random() < 0.05:  # 5% вероятность
                resist_data.T3 = random.uniform(50000, 200000)  # Очень плохой контакт
            
            # Эмитируем сигнал с данными
            self.resistDataReceived.emit(self, resist_data)
            
            # Ждем немного между измерениями
            time.sleep(1)


# Функция для создания эмулятора сенсора
def create_sensor_emulator():
    """Создает и возвращает экземпляр эмулятора сенсора"""
    return SensorEmulator()


# Функция для создания информации о сенсоре-эмуляторе
def create_emulator_sensor_info():
    """Создает информацию о сенсоре-эмуляторе"""
    return SensorInfo(
        SensFamily=SensorFamily.LEBrainBit,
        SensModel=0,
        Name="BrainBit Emulator",
        Address="EMULATOR-001",
        SerialNumber="EMUL-001",
        PairingRequired=False,
        RSSI=-50
    )