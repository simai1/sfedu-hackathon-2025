
from neurosdk.scanner import Scanner
from filters_lib import filters_sdk, filter_types
from neurosdk.cmn_types import *

import concurrent.futures
from time import sleep

flist = filters_sdk.FilterList()


def sensor_found(scanner, sensors):
    for index in range(len(sensors)):
        print('Sensor found: %s' % sensors[index])


def on_sensor_state_changed(sensor, state):
    print('Sensor {0} is {1}'.format(sensor.name, state))


def on_battery_changed(sensor, battery):
    print('Battery: {0}'.format(battery))


def on_signal_received(sensor, data):
    samples_o1 = [x.O1 for x in data]
    samples_o1 = flist.filter_array(samples_o1)
    print(samples_o1)
    samples_o2 = [x.O2 for x in data]
    samples_o2 = flist.filter_array(samples_o2)
    print(samples_o2)
    samples_t3 = [x.T3 for x in data]
    samples_t3 = flist.filter_array(samples_t3)
    print(samples_t3)
    samples_t4 = [x.T4 for x in data]
    samples_t4 = flist.filter_array(samples_t4)
    print(samples_t4)


try:
    scanner = Scanner([SensorFamily.LEBrainBit, SensorFamily.LEBrainBitBlack])

    scanner.sensorsChanged = sensor_found
    scanner.start()
    print("Starting search for 5 sec...")
    sleep(5)
    scanner.stop()

    sensorsInfo = scanner.sensors()
    for i in range(len(sensorsInfo)):
        current_sensor_info = sensorsInfo[i]
        print(sensorsInfo[i])


        def device_connection(sensor_info):
            return scanner.create_sensor(sensor_info)


        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(device_connection, current_sensor_info)
            sensor = future.result()
            print("Device connected")

        sensor.sensorStateChanged = on_sensor_state_changed
        sensor.batteryChanged = on_battery_changed

        if sensor.is_supported_feature(SensorFeature.Signal):
            sensor.signalDataReceived = on_signal_received

        # filters setup
        f1 = filters_sdk.Filter()
        f1.init_by_param(filter_types.FilterParam(filter_types.FilterType.ft_band_stop, 250, 60))

        f2 = filters_sdk.Filter()
        f2.init_by_param(filter_types.FilterParam(filter_types.FilterType.ft_band_stop, 250, 50))

        f3 = filters_sdk.Filter()
        f3.init_by_param(filter_types.FilterParam(filter_types.FilterType.ft_lp, 250, 1))

        flist.add_filter(f1)
        flist.add_filter(f2)
        flist.add_filter(f3)

        if sensor.is_supported_command(SensorCommand.StartSignal):
            sensor.exec_command(SensorCommand.StartSignal)
            print("Start signal")
            sleep(120)
            sensor.exec_command(SensorCommand.StopSignal)
            print("Stop signal")

        sensor.disconnect()
        print("Disconnect from sensor")
        del sensor

    del scanner
    print('Remove scanner')
except Exception as err:
    print(err)
