import queue
import threading

from callibri_ecg.callibri_ecg_lib import CallibriMath
from neurosdk.scanner import Scanner
from neurosdk.cmn_types import *

import concurrent.futures
from time import sleep

signal_data = queue.Queue()  # max size 100
calculations_done = False
buf_size = 100


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
            signal_data.put(sample)


def worker():
    while not calculations_done:
        if signal_data.qsize() > buf_size:
            rawData = [signal_data.get() for _ in range(buf_size)]
            callibri_math.push_data(rawData)
            callibri_math.process_data_arr()
            if callibri_math.rr_detected():
                rr = callibri_math.get_rr()
                print("rr: " + str(rr))
                hr = callibri_math.get_hr()
                print("hr: " + str(hr))
                pi = callibri_math.get_pressure_index()
                print("pressure index: " + str(pi))
                moda = callibri_math.get_moda()
                print("moda: " + str(moda))
                variation_dist = callibri_math.get_variation_dist()
                print("variation dist: " + str(variation_dist))

                callibri_math.set_rr_checked()
                signal_data.task_done()


try:
    samplingRate = buf_size * 10
    dataWindow = samplingRate / 2
    nwinsForPressureIndex = 30
    callibri_math = CallibriMath(samplingRate, int(dataWindow), nwinsForPressureIndex)
    callibri_math.init_filter()
    scanner = Scanner([SensorFamily.LECallibri, SensorFamily.LEKolibri])

    scanner.sensorsChanged = sensor_found
    scanner.start()
    print("Starting search for 5 sec...")
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

        sensor.signal_type = CallibriSignalType.ECG
        sensor.sampling_frequency = SensorSamplingFrequency.FrequencyHz1000
        sensor.hardware_filters = [SensorFilter.HPFBwhLvl1CutoffFreq1Hz,
                                   SensorFilter.BSFBwhLvl2CutoffFreq45_55Hz,
                                   SensorFilter.BSFBwhLvl2CutoffFreq55_65Hz]
        # to  read the signal from the pads
        sensor.ext_sw_input=SensorExternalSwitchInput.Electrodes

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
            sensor.exec_command(SensorCommand.StartSignal)
            print("Start ECG calculating")

            threading.Thread(target=worker, daemon=True).start()

            sleep(60)
            calculations_done = True
            sensor.exec_command(SensorCommand.StopSignal)
            print("Stop ECG calculating")

        sensor.disconnect()
        print("Disconnect from sensor")
        del sensor

    del scanner
    del callibri_math
    print('Remove scanner')
except Exception as err:
    print(err)
