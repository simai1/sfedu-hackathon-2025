import contextlib
from threading import Thread

from PyQt6.QtCore import QObject, pyqtSignal, QThread
from neurosdk.scanner import Scanner
from neurosdk.sensor import Sensor
from neurosdk.cmn_types import *


class Worker(QObject):
    finished = pyqtSignal()

    def __init__(self, work):
        super().__init__()
        self.work = work

    def run(self):
        self.work()
        self.finished.emit()


class BrainBitController(QObject):
    sensorConnectionState = pyqtSignal(SensorState)

    def __init__(self):
        super().__init__()
        self.__sensor = None
        self.__scanner = Scanner([SensorFamily.LEBrainBit, SensorFamily.LECallibri])
        self.sensorsFounded = None
        self.sensorBattery = None
        self.resistReceived = None
        self.signalReceived = None
        self.thread = None
        self.worker = None
        
        # Для работы с эмулятором
        self.__emulator_resist_handler = None
        self.__emulator_signal_handler = None

    def start_scan(self):
        if self.__sensor is not None and self.__sensor.state is SensorState.StateInRange:
            self.__sensor.disconnect()
            del self.__sensor
            self.__sensor = None

        def sensors_founded(scanner, sensors):
            self.sensorsFounded(sensors)
        self.__scanner.sensorsChanged = sensors_founded
        thread = Thread(target=self.__scanner.start)
        thread.start()

    def stop_scan(self):
        self.__scanner.stop()
        self.__scanner.sensorsChanged = None

    def create_and_connect(self, sensor_info: SensorInfo):
        def device_connection():
            try:
                self.__sensor = self.__scanner.create_sensor(sensor_info)
            except Exception as err:
                print(err)
            if self.__sensor is not None:
                self.__sensor.sensorStateChanged = self.__connection_state_changed
                self.__sensor.batteryChanged = self.__battery_changed
                if self.sensorConnectionState is not None:
                    self.sensorConnectionState.emit(SensorState.StateInRange)
            else:
                if self.sensorConnectionState is not None:
                    self.sensorConnectionState.emit(SensorState.StateOutOfRange)

        self.thread = QThread()
        self.worker = Worker(device_connection)
        self.worker.moveToThread(self.thread)
        self.thread.started.connect(self.worker.run)
        self.worker.finished.connect(self.thread.quit)
        self.thread.start()

    def disconnect_sensor(self):
        if self.__sensor is not None:
            try:
                self.__sensor.disconnect()
                if self.sensorConnectionState is not None:
                    self.sensorConnectionState.emit(SensorState.StateOutOfRange)
            except Exception as e:
                print(f"Error disconnecting sensor: {e}")
            finally:
                self.__sensor = None
    
    def is_sensor_connected(self):
        """Проверка, подключено ли устройство"""
        return self.__sensor is not None and (hasattr(self.__sensor, 'state') and self.__sensor.state == SensorState.StateInRange)

    def __connection_state_changed(self, sensor: Sensor, state: SensorState):
        if self.sensorConnectionState is not None:
            self.sensorConnectionState.emit(state)

    def __battery_changed(self, sensor: Sensor, battery: int):
        if self.sensorBattery is not None:
            self.sensorBattery(battery)

    def full_info(self):
        pass

    def start_resist(self):
        if self.__sensor is None:
            return
            
        def resist_data_received(sensor, resist):
            if self.resistReceived is not None:
                self.resistReceived(resist)
                
        # Сохраняем обработчик для эмулятора
        self.__emulator_resist_handler = resist_data_received
        
        # Для эмулятора сигналы уже подключены, для реального сенсора подключаем по старому подходу
        if not (hasattr(self.__sensor, 'resistDataReceived') and callable(getattr(self.__sensor, 'resistDataReceived', None))):
            # Для реального сенсора используем старый подход
            self.__sensor.resistDataReceived = resist_data_received
        self.__execute_command(SensorCommand.StartResist)

    def stop_resist(self):
        self.__execute_command(SensorCommand.StopResist)
        # Для эмулятора не устанавливаем resistDataReceived в None
        # так как это PyQt сигнал, а не просто атрибут
        if not hasattr(self.__sensor, 'resistDataReceived') or not callable(getattr(self.__sensor, 'resistDataReceived', None)):
            self.__sensor.resistDataReceived = None

    def start_signal(self):
        if self.__sensor is None:
            return
            
        def signal_data_received(sensor, signal):
            if self.signalReceived is not None:
                self.signalReceived(signal)
                
        # Сохраняем обработчик для эмулятора
        self.__emulator_signal_handler = signal_data_received
        
        # Для эмулятора сигналы уже подключены, для реального сенсора подключаем по старому подходу
        if not (hasattr(self.__sensor, 'signalDataReceived') and callable(getattr(self.__sensor, 'signalDataReceived', None))):
            # Для реального сенсора используем старый подход
            self.__sensor.signalDataReceived = signal_data_received
        self.__execute_command(SensorCommand.StartSignal)

    def stop_signal(self):
        self.__execute_command(SensorCommand.StopSignal)
        # Для эмулятора не устанавливаем signalDataReceived в None
        # так как это PyQt сигнал, а не просто атрибут
        if not hasattr(self.__sensor, 'signalDataReceived') or not callable(getattr(self.__sensor, 'signalDataReceived', None)):
            self.__sensor.signalDataReceived = None

    def __execute_command(self, command: SensorCommand):
        def execute_command():
            try:
                self.__sensor.exec_command(command)
            except Exception as err:
                print(err)
        thread = Thread(target=execute_command)
        thread.start()

    def __del__(self):
        with contextlib.suppress(Exception):
            if self.__sensor is not None:
                self.__sensor.disconnect()
            del self.__sensor
            
    def set_emulator(self, emulator):
        """Установка эмулятора в качестве сенсора"""
        self.__sensor = emulator
        
        # Подключаем все сигналы эмулятора
        if hasattr(emulator, 'sensorStateChanged'):
            emulator.sensorStateChanged.connect(self.__connection_state_changed)
        if hasattr(emulator, 'batteryChanged'):
            emulator.batteryChanged.connect(self.__battery_changed)
        if hasattr(emulator, 'signalDataReceived'):
            # Подключаем обработчик сигнала
            def signal_handler(sensor, data):
                if self.__emulator_signal_handler:
                    self.__emulator_signal_handler(sensor, data)
            emulator.signalDataReceived.connect(signal_handler)
        if hasattr(emulator, 'resistDataReceived'):
            # Подключаем обработчик сопротивления
            def resist_handler(sensor, data):
                if self.__emulator_resist_handler:
                    self.__emulator_resist_handler(sensor, data)
            emulator.resistDataReceived.connect(resist_handler)
            
        # Имитируем подключение
        emulator.connect()


brain_bit_controller = BrainBitController()