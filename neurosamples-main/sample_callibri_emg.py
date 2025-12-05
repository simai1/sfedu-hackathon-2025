import queue
import threading

from neurosdk.scanner import Scanner
from neurosdk.cmn_types import *

import concurrent.futures
from time import sleep

signal_data = queue.Queue()  # max size 100


def sensor_found(scanner, sensors):
    for index in range(len(sensors)):
        print('Sensor found: %s' % sensors[index])


def on_battery_changed(sensor, battery):
    print('Battery: {0}'.format(battery))


def on_sensor_state_changed(sensor, state):
    print('Sensor {0} is {1}'.format(sensor.name, state))


def on_electrodes_state_changed(sensor, data):
    print(data)


def on_signal_received(sensor, data):
    for pack in data:
        for sample in pack.Samples:
            signal_data.put(sample * 1e6)


def worker():
    while True:
        try:
            data = signal_data.get(block=True)  # Adjust timeout as needed
            print(data)
            signal_data.task_done()
        except queue.Empty:
            break


try:
    scanner = Scanner([SensorFamily.LECallibri, SensorFamily.LEKolibri])

    print("Starting search for 5 sec...")
    scanner.sensorsChanged = sensor_found
    scanner.start()
    sleep(5)
    scanner.stop()

    sensorsInfo = scanner.sensors()
    if len(sensorsInfo) > 0:
        print("Connect to first sensor")
        current_sensor_info = sensorsInfo[0]
        print(sensorsInfo[0])


        def device_connection(sensor_info):
            return scanner.create_sensor(sensor_info)


        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(device_connection, current_sensor_info)
            sensor = future.result()
            print("Device connected")

        sensor.sensorStateChanged = on_sensor_state_changed
        sensor.batteryChanged = on_battery_changed

        # EMG type setting
        sensor.signal_type_callibri = CallibriSignalType.EMG

        # Frequency setting
        sensor.sampling_frequency = SensorSamplingFrequency.FrequencyHz1000

        # Filter setting
        sensor.hardware_filters = [SensorFilter.LPFBwhLvl2CutoffFreq400Hz,
                                   SensorFilter.BSFBwhLvl2CutoffFreq45_55Hz,
                                   SensorFilter.HPFBwhLvl2CutoffFreq10Hz]

        # Input type setting
        sensor.ext_sw_input = SensorExternalSwitchInput.Electrodes

        if sensor.is_supported_parameter(SensorParameter.SamplingFrequency):
            print(sensor.sampling_frequency)
        if sensor.is_supported_parameter(SensorParameter.Gain):
            print(sensor.gain)
        if sensor.is_supported_parameter(SensorParameter.Offset):
            print(sensor.data_offset)
        if sensor.is_supported_parameter(SensorParameter.ExternalSwitchState):
            print(sensor.ext_sw_input)

        sensor.electrodeStateChanged = on_electrodes_state_changed

        if sensor.is_supported_feature(SensorFeature.Signal):
            sensor.signalDataReceived = on_signal_received

        if sensor.is_supported_command(SensorCommand.StartSignal):
            print("Start EMG")
            sensor.exec_command(SensorCommand.StartSignal)
            threading.Thread(target=worker, daemon=True).start()
            sleep(60)
            print("Stop EMG")
            sensor.exec_command(SensorCommand.StopSignal)

        print("Disconnect from sensor")
        sensor.disconnect()
        del sensor

    print('Remove scanner')
    del scanner
except Exception as err:
    print(err)
