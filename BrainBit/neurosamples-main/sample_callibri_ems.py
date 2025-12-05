from time import sleep

from neurosdk.scanner import Scanner
from neurosdk.cmn_types import *

try:
    scanner = Scanner([SensorFamily.LECallibri, SensorFamily.LEKolibri])

    print("Starting search for 5 sec...")
    scanner.start()
    sleep(5)
    scanner.stop()

    sensorsInfo = scanner.sensors()
    if len(sensorsInfo) > 0:
        print("Connect to first sensor")
        current_sensor_info = sensorsInfo[0]
        print(sensorsInfo[0])
        sensor = scanner.create_sensor(sensorsInfo[0])
        if sensor.is_supported_feature(SensorFeature.CurrentStimulator):

            print("It is EMS sensor!")
            stParams: CallibriStimulationParams = CallibriStimulationParams(50, 100, 10, 3)
            sensor.stimulator_param = stParams
            sensor.exec_command(SensorCommand.StartCurrentStimulation)
            sleep(5)
            sensor.exec_command(SensorCommand.StopCurrentStimulation)

            print("Disconnect from sensor")
            sensor.disconnect()
        else:
            print("It is MF sensor :(")

    print('Remove scanner')
    del scanner
except Exception as err:
    print(err)