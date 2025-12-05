from neurosdk.scanner import Scanner
# from neurosdk.cmn_types import SensorFamily, SensorCommand

from imitation import FakeScanner, SensorCommand  


def on_signal(sensor, data):
    print("EEG:", data)

def main():
    # Создаём сканер с фильтром **SensorFamily.LEBrainBit**
    # scanner = Scanner([SensorFamily.LEBrainBit])  # расскомментить для реального устройства
    scanner = FakeScanner(filters=["BrainBit"])
    scanner.start()
    sensors = scanner.sensors()
    scanner.stop()

    if not sensors:
        print("Устройство не найдено")
        return

    sensor = sensors[0]  # первое найденное
    # Подписка на сигнал (для BrainBit)
    sensor.brainBitSignalDataReceived = on_signal
    # Старт сигнала
    sensor.exec_command(SensorCommand.CommandStartSignal)

    try:
        input("Нажмите Enter для остановки...\n")
    finally:
        sensor.exec_command(SensorCommand.CommandStopSignal)
        sensor.disconnect()

if __name__ == "__main__":
    main()
