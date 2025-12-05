import time
import random
from threading import Thread
from dataclasses import dataclass

@dataclass
class EEGSample:
    PackNum: int
    Marker: int
    O1: float
    O2: float
    T3: float
    T4: float

class SensorCommand:
    CommandStartSignal = "start_signal"
    CommandStopSignal = "stop_signal"

class FakeBrainBitSensor:
    def __init__(self, name="FakeBrainBit"):
        self.name = name
        self.signal_callbacks = []
        self.running = False
        self.packet_counter = 0

    def subscribe(self, callback):
        """Подписка на получение сигналов"""
        self.signal_callbacks.append(callback)

    def exec_command(self, command):
        if command == SensorCommand.CommandStartSignal:
            print(f"[{self.name}] Команда: START SIGNAL")
            self.start()
        elif command == SensorCommand.CommandStopSignal:
            print(f"[{self.name}] Команда: STOP SIGNAL")
            self.stop()

    def start(self):
        if not self.running:
            self.running = True
            Thread(target=self._generate_signals, daemon=True).start()

    def stop(self):
        self.running = False

    def _generate_signals(self):
        while self.running:
            self.packet_counter += 1
            # Имитация данных EEG для каналов O1, O2, T3, T4
            sample = EEGSample(
                PackNum=self.packet_counter,
                Marker=random.randint(0, 1),  # 0 или 1 случайно
                O1=random.uniform(0.0, 1.0),
                O2=random.uniform(0.0, 1.0),
                T3=random.uniform(0.0, 1.0),
                T4=random.uniform(0.0, 1.0)
            )
            # Выводим в консоль
            print(f"[{self.name}] {sample}")
            for cb in self.signal_callbacks:
                cb(self, sample)
            time.sleep(0.1)

class FakeScanner:
    def __init__(self, filters=None):
        self.filters = filters or []

    def start(self):
        print("Сканирование устройств...")
        time.sleep(1)

    def stop(self):
        print("Сканирование завершено.")

    def sensors(self):
        return [FakeBrainBitSensor()]
