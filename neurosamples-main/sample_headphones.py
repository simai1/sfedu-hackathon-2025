from neurosdk.scanner import Scanner
from neurosdk.cmn_types import *

from time import sleep


def sensor_found(scanner, sensors):
    for index in range(len(sensors)):
        print('Sensor found: %s' % sensors[index])


def on_sensor_state_changed(sensor, state):
    print('Sensor {0} is {1}'.format(sensor.name, state))


def on_battery_changed(sensor, battery):
    print('Battery: {0}'.format(battery))


def on_signal_received(sensor, data):
    print(data)


def on_resist_received(sensor, data):
    print(data)


def on_amp_received(sensor, data):
    print(data)


try:
    scanner = Scanner([SensorFamily.LEHeadPhones2])

    scanner.sensorsChanged = sensor_found
    scanner.start()
    print("Starting search for 5 sec...")
    sleep(5)
    scanner.stop()

    sensorsInfo = scanner.sensors()
    for i in range(len(sensorsInfo)):
        current_sensor_info = sensorsInfo[i]
        print(sensorsInfo[i])

        sensor = scanner.create_sensor(current_sensor_info)
        print("Device connected")

        sensor.sensorStateChanged = on_sensor_state_changed
        sensor.batteryChanged = on_battery_changed

        sensFamily = sensor.sens_family

        sensorState = sensor.state
        if sensorState == SensorState.StateInRange:
            print("Connected")
        else:
            print("Disconnected")

        amp_param = sensor.amplifier_param
        amp_param.ChGain1 = SensorGain.Gain6
        amp_param.ChGain2 = SensorGain.Gain6
        amp_param.ChGain3 = SensorGain.Gain6
        amp_param.ChGain4 = SensorGain.Gain6
        sensor.amplifier_param = amp_param

        print(sensFamily)
        print(sensor.features)
        print(sensor.commands)
        print(sensor.parameters)
        print(sensor.name)
        print(sensor.state)
        print(sensor.address)
        print(sensor.serial_number)
        print(sensor.batt_power)
        if sensor.is_supported_parameter(SensorParameter.SamplingFrequency):
            print(sensor.sampling_frequency)
        if sensor.is_supported_parameter(SensorParameter.Gain):
            print(sensor.gain)
        if sensor.is_supported_parameter(SensorParameter.Offset):
            print(sensor.data_offset)
        print(sensor.version)

        sensor.sensorAmpModeChanged = on_amp_received

        if sensor.is_supported_feature(SensorFeature.Signal):
            sensor.signalDataReceived = on_signal_received

        if sensor.is_supported_feature(SensorFeature.Resist):
            sensor.resistDataReceived = on_resist_received

        if sensor.is_supported_command(SensorCommand.StartSignal):
            sensor.exec_command(SensorCommand.StartSignal)
            print("Start signal")
            sleep(5)
            sensor.exec_command(SensorCommand.StopSignal)
            print("Stop signal")

        if sensor.is_supported_command(SensorCommand.StartResist):
            sensor.exec_command(SensorCommand.StartResist)
            print("Start resist")
            sleep(5)
            sensor.exec_command(SensorCommand.StopResist)
            print("Stop resist")

        sensor.disconnect()
        print("Disconnect from sensor")
        del sensor

    del scanner
    print('Remove scanner')
except Exception as err:
    print(err)
