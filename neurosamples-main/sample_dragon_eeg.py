from typing import List

from neurosdk.scanner import Scanner
from neurosdk.cmn_types import *

import concurrent.futures
from time import sleep

from neurosdk.sensor import Sensor


def sensor_found(scanner, sensors):
    for index in range(len(sensors)):
        print('Sensor found: %s' % sensors[index])


def on_sensor_state_changed(sensor: Sensor, state):
    print('Sensor {0} is {1}'.format(sensor.name, state))


def on_battery_changed(sensor: Sensor, battery):
    print('Battery: {0}'.format(battery))


def on_signal_received(sensor: Sensor, data):
    print(data)


def on_resist_received(sensor: Sensor, data):
    print(data)

def on_signal_resist_received(sensor: Sensor, signal: List[SignalChannelsData], resist: List[ResistChannelsData]):
    print("Signal: {}".format(signal))
    print("Resist: {}".format(resist))

def on_amp_received(sensor: Sensor, data):
    print(data)

try:
    scanner = Scanner([SensorFamily.LENeuroEEG])

    scanner.sensorsChanged = sensor_found
    scanner.start()
    print("Starting search for 5 sec...")
    sleep(5)
    scanner.stop()

    sensorsInfo = scanner.sensors()
    for i in range(len(sensorsInfo)):
        current_sensor_info = sensorsInfo[i]
        print(sensorsInfo[i])

        sensor = scanner.create_sensor(sensorsInfo[i])

        sensor.sensorStateChanged = on_sensor_state_changed
        sensor.batteryChanged = on_battery_changed

        sensorState = sensor.state
        if sensorState == SensorState.StateInRange:
            print("connected")
        else:
            print("Disconnected")

        print("Info:")

        print(sensor.sens_family)
        print(sensor.features)
        print(sensor.commands)
        print(sensor.parameters)
        print(sensor.name)
        print(sensor.state)
        print(sensor.address)
        print(sensor.serial_number)
        print(sensor.batt_power)
        print(sensor.sampling_frequency)
        print(sensor.data_offset)
        print(sensor.version)
        print(sensor.supported_channels)

        ch_count = sensor.channels_count

        if sensor.amp_mode == SensorAmpMode.Signal or sensor.amp_mode == SensorAmpMode.Resist or sensor.amp_mode == SensorAmpMode.SignalResist:
            sensor.exec_command(SensorCommand.StopSignal)
            sensor.exec_command(SensorCommand.StopResist)
            sensor.exec_command(SensorCommand.StopSignalAndResist)


        amp_param: NeuroEEGAmplifierParam = sensor.amplifier_param
        amp_param.ChannelGain = [SensorGain.Gain6 for i in range(ch_count)]
        amp_param.Frequency = SensorSamplingFrequency.FrequencyHz500
        amp_param.ChannelMode = [EEGChannelMode.EEGChModeSignalResist for i in range(ch_count)]
        sensor.amplifier_param = amp_param

        sensor.sensorAmpModeChanged = on_amp_received

        if sensor.is_supported_command(SensorCommand.StartSignal):
            sensor.signalDataReceived = on_signal_received
            sensor.exec_command(SensorCommand.StartSignal)
            print("Start signal")
            sleep(5)
            sensor.signalDataReceived = None
            sensor.exec_command(SensorCommand.StopSignal)
            print("Stop signal")

        if sensor.is_supported_command(SensorCommand.StartResist):
            sensor.resistDataReceived = on_resist_received
            sensor.exec_command(SensorCommand.StartResist)
            print("Start resist")
            sleep(5)
            sensor.resistDataReceived = None
            sensor.exec_command(SensorCommand.StopResist)
            print("Stop resist")

        if sensor.is_supported_command(SensorCommand.StartSignalAndResist):
            sensor.signalResistDataReceived = on_signal_resist_received
            sensor.exec_command(SensorCommand.StartSignalAndResist)
            print("Start signal and resist")
            sleep(5)
            sensor.signalResistDataReceived = None
            sensor.exec_command(SensorCommand.StopSignalAndResist)
            print("Stop signal and resist")

        print("Disconnect from sensor")
        del sensor

    del scanner
    print('Remove scanner')
except Exception as err:
    print(err)
