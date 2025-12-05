import sys

from PyQt6.QtWidgets import QApplication, QMainWindow, QStackedWidget, QWidget
from PyQt6.uic import loadUi
from neurosdk.cmn_types import SensorState

from neuro_impl.brain_bit_controller import brain_bit_controller, BrainBitController
from neuro_impl.emotions_bipolar_controller import EmotionBipolar
from neuro_impl.emotions_monopolar_controller import EmotionMonopolar
from neuro_impl.spectrum_controller import SpectrumController
from neuro_impl.sensor_emulator import create_sensor_emulator, create_emulator_sensor_info
from PyQt6.QtWidgets import QPushButton
from ui.plots import SpectrumPlot, SignalPlot


class MenuScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi("ui/MenuScreenRuUI.ui", self)
        brain_bit_controller.sensorConnectionState.connect(self.is_sensor_connected)
        self.toResistButton.setEnabled(False)
        self.toSignalButton.setEnabled(False)
        self.toEmBipolarButton.setEnabled(False)
        self.toEmMonopolarButton.setEnabled(False)
        self.toSpectrumButton.setEnabled(False)
        self.toSpectrumButton.setEnabled(False)
        self.toSearchButton.clicked.connect(self.go_to_search)
        self.toResistButton.clicked.connect(self.go_to_resist)
        self.toSignalButton.clicked.connect(self.go_to_signal)
        self.toEmBipolarButton.clicked.connect(self.go_to_emotions)
        self.toEmMonopolarButton.clicked.connect(self.go_to_monopolar_emotions)
        self.toSpectrumButton.clicked.connect(self.go_to_spectrum)
        self.emulatorButton.clicked.connect(self.use_emulator)

    def is_sensor_connected(self, state):
        buttons_enabled = state == SensorState.StateInRange
        self.toResistButton.setEnabled(buttons_enabled)
        self.toSignalButton.setEnabled(buttons_enabled)
        self.toEmBipolarButton.setEnabled(buttons_enabled)
        self.toEmMonopolarButton.setEnabled(buttons_enabled)
        self.toSpectrumButton.setEnabled(buttons_enabled)

    def go_to_search(self):
        stackNavigation.setCurrentWidget(searchScreen)

    def go_to_resist(self):
        stackNavigation.setCurrentWidget(resistScreen)

    def go_to_signal(self):
        stackNavigation.setCurrentWidget(signalScreen)

    def go_to_emotions(self):
        stackNavigation.setCurrentWidget(emotionBipolarScreen)

    def go_to_monopolar_emotions(self):
        stackNavigation.setCurrentWidget(emotionMonopolarScreen)

    def go_to_spectrum(self):
        stackNavigation.setCurrentWidget(spectrumScreen)
        
    def use_emulator(self):
        # Создаем эмулятор сенсора
        emulator = create_sensor_emulator()
        
        # Устанавливаем эмулятор в контроллер
        brain_bit_controller.set_emulator(emulator)
        
        # Имитируем подключение
        emulator.connect()
        
        # Даем время на подключение обработчиков
        import time
        time.sleep(0.1)


class SearchScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi("ui/SearchScreenRuUI.ui", self)
        self.is_searching = False
        self.sensorsList = None
        self.backButton.clicked.connect(self.__close_screen)
        self.searchButton.clicked.connect(self.__search)
        self.listWidget.itemClicked.connect(self.__connect_to_sensor)

    def __search(self):
        if self.is_searching:
            self.__stop_scan()
        else:
            self.__start_scan()

    def __sensors_founded(self, sensors):
        self.sensorsList = sensors
        self.listWidget.clear()
        self.listWidget.addItems([sens.Name + ' (' + sens.SerialNumber + ')' for sens in sensors])

    def __connect_to_sensor(self, item):
        item_number = self.listWidget.row(item)
        brain_bit_controller.sensorConnectionState.connect(self.__is_sensor_connected)
        brain_bit_controller.create_and_connect(sensor_info=self.sensorsList[item_number])

    def __is_sensor_connected(self, sensor_state):
        self.__close_screen()

    def __start_scan(self):
        self.searchButton.setText('Stop')
        brain_bit_controller.sensorsFounded = self.__sensors_founded
        brain_bit_controller.start_scan()
        self.is_searching = True

    def __stop_scan(self):
        self.searchButton.setText('Search')
        brain_bit_controller.stop_scan()
        brain_bit_controller.sensorsFounded = None
        self.is_searching = False

    def __close_screen(self):
        try:
            brain_bit_controller.sensorConnectionState.disconnect(self.__is_sensor_connected)
        except Exception as err:
            print(err)
        self.__stop_scan()
        stackNavigation.setCurrentWidget(menuScreen)


class ResistanceScreen(QMainWindow):
    normal_resist_border = 2_000_000

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi("ui/ResistanceScreenRuUI.ui", self)
        self.resistButton.setText('Start')
        self.backButton.clicked.connect(self.__close_screen)
        self.resistButton.clicked.connect(self.__resist_button_clicked)
        brain_bit_controller.resistReceived = self.resist_received

        self.__is_started = False

    def __resist_button_clicked(self):
        if self.__is_started:
            self.__stop_resist()
        else:
            self.__start_resist()

    def __start_resist(self):
        self.resistButton.setText('Stop')
        brain_bit_controller.resistReceived = self.resist_received
        brain_bit_controller.start_resist()
        self.__is_started = True

    def __stop_resist(self):
        self.resistButton.setText('Start')
        brain_bit_controller.stop_resist()
        brain_bit_controller.resistReceived = None
        self.__is_started = False

    def resist_received(self, resist):
        self.o1Value.setText(str(resist.O1))
        self.o1Q.setText('Good' if resist.O1 != float('inf') and resist.O1 > self.normal_resist_border else 'Poor')
        self.o2Value.setText(str(resist.O2))
        self.o2Q.setText('Good' if resist.O2 != float('inf') and resist.O2 > self.normal_resist_border else 'Poor')
        self.t3Value.setText(str(resist.T3))
        self.t3Q.setText('Good' if resist.T3 != float('inf') and resist.T3 > self.normal_resist_border else 'Poor')
        self.t4Value.setText(str(resist.T4))
        self.t4Q.setText('Good' if resist.T4 != float('inf') and resist.T4 > self.normal_resist_border else 'Poor')

    def __close_screen(self):
        self.__stop_resist()
        stackNavigation.setCurrentWidget(menuScreen)


class SignalScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi("ui/SignalScreenRuUI.ui", self)
        self.backButton.clicked.connect(self.__close_screen)
        self.signalButton.clicked.connect(self.__start_button_clicked)

        self.o1Graph = SignalPlot()
        self.o2Graph = SignalPlot()
        self.t3Graph = SignalPlot()
        self.t4Graph = SignalPlot()
        self.signalScreenLayout.addWidget(self.o1Graph)
        self.signalScreenLayout.addWidget(self.o2Graph)
        self.signalScreenLayout.addWidget(self.t3Graph)
        self.signalScreenLayout.addWidget(self.t4Graph)

        self.__is_started = False

    def __start_button_clicked(self):
        if self.__is_started:
            self.__stop_signal()
        else:
            self.__start_signal()

    def signal_received(self, signal):
        o1Samples = [sample.O1 for sample in signal]
        o2Samples = [sample.O2 for sample in signal]
        t3Samples = [sample.T3 for sample in signal]
        t4Samples = [sample.T4 for sample in signal]
        self.o1Graph.update_data(o1Samples)
        self.o2Graph.update_data(o2Samples)
        self.t3Graph.update_data(t3Samples)
        self.t4Graph.update_data(t4Samples)

    def __start_signal(self):
        self.signalButton.setText('Stop')
        self.o1Graph.start_draw()
        self.o2Graph.start_draw()
        self.t3Graph.start_draw()
        self.t4Graph.start_draw()
        brain_bit_controller.signalReceived = self.signal_received
        brain_bit_controller.start_signal()
        self.__is_started = True

    def __stop_signal(self):
        self.signalButton.setText('Start')
        self.o1Graph.stop_draw()
        self.o2Graph.stop_draw()
        self.t3Graph.stop_draw()
        self.t4Graph.stop_draw()
        brain_bit_controller.stop_signal()
        brain_bit_controller.resistReceived = None
        self.__is_started = False

    def __close_screen(self):
        self.__stop_signal()
        stackNavigation.setCurrentWidget(menuScreen)


class EmotionBipolarScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi("ui/EmotionBipolarScreenRuUI.ui", self)
        self.backButton.clicked.connect(self.__close_screen)
        self.startBipolarEmotionButton.clicked.connect(self.start_calibration)

        self.emotionController = EmotionBipolar()
        self.emotionController.progressCalibrationCallback = self.calibration_callback
        self.emotionController.isArtifactedSequenceCallback = self.is_artifacted_sequence_callback
        self.emotionController.isBothSidesArtifactedCallback = self.is_both_sides_artifacted_callback
        self.emotionController.lastMindDataCallback = self.mind_data_callback
        self.emotionController.lastSpectralDataCallback = self.last_spectral_data_callback
        self.emotionController.rawSpectralDataCallback = self.raw_spectral_data_callback

        self.is_started = False

    def start_calibration(self):
        if self.is_started:
            self.__stop_signal()
        else:
            self.__start_signal()

    def __start_signal(self):
        self.startBipolarEmotionButton.setText('Stop')
        self.emotionController.start_calibration()
        brain_bit_controller.signalReceived = self.emotionController.process_data
        brain_bit_controller.start_signal()
        self.is_started = True

    def __stop_signal(self):
        self.startBipolarEmotionButton.setText('Start')
        brain_bit_controller.stop_signal()
        brain_bit_controller.signalReceived = None
        self.is_started = False

    def calibration_callback(self, progress):
        print(f"EmotionBipolarScreen: Calibration progress {progress}%")
        self.calibrationProgress.setValue(progress)

    def is_artifacted_sequence_callback(self, artifacted):
        print(f"EmotionBipolarScreen: Artifacted sequence: {artifacted}")
        self.artSequenceLabel.setText('Artefacted sequence: ' + str(artifacted))

    def is_both_sides_artifacted_callback(self, artifacted):
        print(f"EmotionBipolarScreen: Both sides artifacted: {artifacted}")
        self.artBothSidesLabel.setText('Artefacted both side: ' + str(artifacted))

    def mind_data_callback(self, data):
        print(f"EmotionBipolarScreen: Mind data - Attention: {data.rel_attention:.2f}%, Relaxation: {data.rel_relaxation:.2f}%")
        self.attentionPercentLabel.setText(str(round(data.rel_attention, 2)))
        self.relaxPercentLabel.setText(str(round(data.rel_relaxation, 2)))
        self.attentionRawLabel.setText(str(round(data.inst_attention, 2)))
        self.relaxRawLabel.setText(str(round(data.inst_relaxation, 2)))

    def last_spectral_data_callback(self, spectral_data):
        print(f"EmotionBipolarScreen: Spectral data - Delta: {spectral_data.delta*100:.2f}%, Theta: {spectral_data.theta*100:.2f}%, Alpha: {spectral_data.alpha*100:.2f}%, Beta: {spectral_data.beta*100:.2f}%, Gamma: {spectral_data.gamma*100:.2f}%")
        self.deltaPercentLabel.setText(str(round(spectral_data.delta * 100, 2)) + '%')
        self.thetaPercentLabel.setText(str(round(spectral_data.theta * 100, 2)) + '%')
        self.alphaPercentLabel.setText(str(round(spectral_data.alpha * 100, 2)) + '%')
        self.betaPercentLabel.setText(str(round(spectral_data.beta * 100, 2)) + '%')
        self.gammaPercentLabel.setText(str(round(spectral_data.gamma * 100, 2)) + '%')

    def raw_spectral_data_callback(self, spect_vals):
        print(f"EmotionBipolarScreen: Raw spectral data - Alpha: {spect_vals.alpha:.2f}, Beta: {spect_vals.beta:.2f}")
        self.alphaRawLabel.setText(str(round(spect_vals.alpha, 2)))
        self.betaRawLabel.setText(str(round(spect_vals.beta, 2)))

    def __close_screen(self):
        self.__stop_signal()
        stackNavigation.setCurrentWidget(menuScreen)


class EmotionMonopolarScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi("ui/EmotionMonopolarScreenRuUI.ui", self)
        self.backButton.clicked.connect(self.__close_screen)
        self.startEmotionButton.clicked.connect(self.__start_calibration)
        self.is_started = False

        self.emotionController = EmotionMonopolar()
        self.emotionController.progressCalibrationCallback = self.calibration_callback
        self.emotionController.isArtifactedSequenceCallback = self.is_artifacted_sequence_callback
        self.emotionController.isBothSidesArtifactedCallback = self.is_both_sides_artifacted_callback
        self.emotionController.lastMindDataCallback = self.mind_data_callback
        self.emotionController.lastSpectralDataCallback = self.last_spectral_data_callback
        self.emotionController.rawSpectralDataCallback = self.raw_spectral_data_callback

    def __start_calibration(self):
        if self.is_started:
            self.__stop_signal()
        else:
            self.__start_signal()

    def __start_signal(self):
        self.startEmotionButton.setText('Stop')
        self.emotionController.start_calibration()
        brain_bit_controller.signalReceived = self.emotionController.process_data
        brain_bit_controller.start_signal()
        self.is_started = True

    def __stop_signal(self):
        self.startEmotionButton.setText('Start')
        brain_bit_controller.stop_signal()
        brain_bit_controller.signalReceived = None
        self.is_started = False

    def calibration_callback(self, progress, channel):
        print(f"EmotionMonopolarScreen: Calibration progress for {channel}: {progress}%")
        match channel:
            case 'O1':
                self.o1calibrationProgress.setValue(progress)
            case 'O2':
                self.o2calibrationProgress.setValue(progress)
            case 'T3':
                self.t3calibrationProgress.setValue(progress)
            case 'T4':
                self.t4calibrationProgress.setValue(progress)
            case _:
                print('Unknown channel')

    def is_artifacted_sequence_callback(self, artifacted, channel):
        print(f"EmotionMonopolarScreen: Artifacted sequence for {channel}: {artifacted}")
        match channel:
            case 'O1':
                self.o1artSequenceLabel.setText('Artefacted sequence: ' + str(artifacted))
            case 'O2':
                self.o2artSequenceLabel.setText('Artefacted sequence: ' + str(artifacted))
            case 'T3':
                self.t3artSequenceLabel.setText('Artefacted sequence: ' + str(artifacted))
            case 'T4':
                self.t4artSequenceLabel.setText('Artefacted sequence: ' + str(artifacted))
            case _:
                print('Unknown channel')

    def is_both_sides_artifacted_callback(self, artifacted, channel):
        print(f"EmotionMonopolarScreen: Both sides artifacted for {channel}: {artifacted}")
        match channel:
            case 'O1':
                self.o1artBothSidesLabel.setText('Artefacted both side: ' + str(artifacted))
            case 'O2':
                self.o2artBothSidesLabel.setText('Artefacted both side: ' + str(artifacted))
            case 'T3':
                self.t3artBothSidesLabel.setText('Artefacted both side: ' + str(artifacted))
            case 'T4':
                self.t4artBothSidesLabel.setText('Artefacted both side: ' + str(artifacted))
            case _:
                print('Unknown channel')

    def mind_data_callback(self, data, channel):
        print(f"EmotionMonopolarScreen: Mind data for {channel} - Attention: {data.rel_attention:.2f}%, Relaxation: {data.rel_relaxation:.2f}%")
        match channel:
            case 'O1':
                self.o1attentionPercentLabel.setText(str(round(data.rel_attention, 2)))
                self.o1relaxPercentLabel.setText(str(round(data.rel_relaxation, 2)))
                self.o1attentionRawLabel.setText(str(round(data.inst_attention, 2)))
                self.o1relaxRawLabel.setText(str(round(data.inst_relaxation, 2)))
            case 'O2':
                self.o2attentionPercentLabel.setText(str(round(data.rel_attention, 2)))
                self.o2relaxPercentLabel.setText(str(round(data.rel_relaxation, 2)))
                self.o2attentionRawLabel.setText(str(round(data.inst_attention, 2)))
                self.o2relaxRawLabel.setText(str(round(data.inst_relaxation, 2)))
            case 'T3':
                self.t3attentionPercentLabel.setText(str(round(data.rel_attention, 2)))
                self.t3relaxPercentLabel.setText(str(round(data.rel_relaxation, 2)))
                self.t3attentionRawLabel.setText(str(round(data.inst_attention, 2)))
                self.t3relaxRawLabel.setText(str(round(data.inst_relaxation, 2)))
            case 'T4':
                self.t4attentionPercentLabel.setText(str(round(data.rel_attention, 2)))
                self.t4relaxPercentLabel.setText(str(round(data.rel_relaxation, 2)))
                self.t4attentionRawLabel.setText(str(round(data.inst_attention, 2)))
                self.t4relaxRawLabel.setText(str(round(data.inst_relaxation, 2)))
            case _:
                print('Unknown channel')

    def last_spectral_data_callback(self, spectral_data, channel):
        print(f"EmotionMonopolarScreen: Spectral data for {channel} - Delta: {spectral_data.delta*100:.2f}%, Theta: {spectral_data.theta*100:.2f}%, Alpha: {spectral_data.alpha*100:.2f}%, Beta: {spectral_data.beta*100:.2f}%, Gamma: {spectral_data.gamma*100:.2f}%")
        match channel:
            case 'O1':
                self.o1deltaPercentLabel.setText(str(round(spectral_data.delta * 100, 2)) + '%')
                self.o1thetaPercentLabel.setText(str(round(spectral_data.theta * 100, 2)) + '%')
                self.o1alphaPercentLabel.setText(str(round(spectral_data.alpha * 100, 2)) + '%')
                self.o1betaPercentLabel.setText(str(round(spectral_data.beta * 100, 2)) + '%')
                self.o1gammaPercentLabel.setText(str(round(spectral_data.gamma * 100, 2)) + '%')
            case 'O2':
                self.o2deltaPercentLabel.setText(str(round(spectral_data.delta * 100, 2)) + '%')
                self.o2thetaPercentLabel.setText(str(round(spectral_data.theta * 100, 2)) + '%')
                self.o2alphaPercentLabel.setText(str(round(spectral_data.alpha * 100, 2)) + '%')
                self.o2betaPercentLabel.setText(str(round(spectral_data.beta * 100, 2)) + '%')
                self.o2gammaPercentLabel.setText(str(round(spectral_data.gamma * 100, 2)) + '%')
            case 'T3':
                self.t3deltaPercentLabel.setText(str(round(spectral_data.delta * 100, 2)) + '%')
                self.t3thetaPercentLabel.setText(str(round(spectral_data.theta * 100, 2)) + '%')
                self.t3alphaPercentLabel.setText(str(round(spectral_data.alpha * 100, 2)) + '%')
                self.t3betaPercentLabel.setText(str(round(spectral_data.beta * 100, 2)) + '%')
                self.t3gammaPercentLabel.setText(str(round(spectral_data.gamma * 100, 2)) + '%')
            case 'T4':
                self.t4deltaPercentLabel.setText(str(round(spectral_data.delta * 100, 2)) + '%')
                self.t4thetaPercentLabel.setText(str(round(spectral_data.theta * 100, 2)) + '%')
                self.t4alphaPercentLabel.setText(str(round(spectral_data.alpha * 100, 2)) + '%')
                self.t4betaPercentLabel.setText(str(round(spectral_data.beta * 100, 2)) + '%')
                self.t4gammaPercentLabel.setText(str(round(spectral_data.gamma * 100, 2)) + '%')
            case _:
                print('Unknown channel')

    def raw_spectral_data_callback(self, spect_vals, channel):
        print(f"EmotionMonopolarScreen: Raw spectral data for {channel} - Alpha: {spect_vals.alpha:.2f}, Beta: {spect_vals.beta:.2f}")
        match channel:
            case 'O1':
                self.o1alphaRawLabel.setText(str(round(spect_vals.alpha, 2)))
                self.o1betaRawLabel.setText(str(round(spect_vals.beta, 2)))
            case 'O2':
                self.o2alphaRawLabel.setText(str(round(spect_vals.alpha, 2)))
                self.o2betaRawLabel.setText(str(round(spect_vals.beta, 2)))
            case 'T3':
                self.t3alphaRawLabel.setText(str(round(spect_vals.alpha, 2)))
                self.t3betaRawLabel.setText(str(round(spect_vals.beta, 2)))
            case 'T4':
                self.t4alphaRawLabel.setText(str(round(spect_vals.alpha, 2)))
                self.t4betaRawLabel.setText(str(round(spect_vals.beta, 2)))
            case _:
                print('Unknown channel')

    def __close_screen(self):
        self.__stop_signal()
        stackNavigation.setCurrentWidget(menuScreen)


class SpectrumScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi("ui/SpectrumScreenRuUI.ui", self)
        self.backButton.clicked.connect(self.__close_screen)
        self.signalButton.clicked.connect(self.__start_button_clicked)
        self.o1Graph = SpectrumPlot()
        self.o2Graph = SpectrumPlot()
        self.t3Graph = SpectrumPlot()
        self.t4Graph = SpectrumPlot()
        self.o1_graphLayout.addWidget(self.o1Graph)
        self.o2_graphLayout.addWidget(self.o2Graph)
        self.t3_graphLayout.addWidget(self.t3Graph)
        self.t4_graphLayout.addWidget(self.t4Graph)
        self.__is_started = False

        self.spectrumController = SpectrumController()
        self.spectrumController.processedWaves = self.__processed_waves
        self.spectrumController.processedSpectrum = self.__processed_spectrum

    def __start_button_clicked(self):
        if self.__is_started:
            self.__stop_signal()
        else:
            self.__start_signal()

    def __start_signal(self):
        self.signalButton.setText('Stop')
        self.o1Graph.start_draw()
        self.o2Graph.start_draw()
        self.t3Graph.start_draw()
        self.t4Graph.start_draw()
        brain_bit_controller.signalReceived = self.__signal_received
        brain_bit_controller.start_signal()
        self.__is_started = True

    def __stop_signal(self):
        self.signalButton.setText('Start')
        self.o1Graph.stop_draw()
        self.o2Graph.stop_draw()
        self.t3Graph.stop_draw()
        self.t4Graph.stop_draw()
        brain_bit_controller.stop_signal()
        brain_bit_controller.signalReceived = None
        self.__is_started = False

    def __signal_received(self, signal):
        self.spectrumController.process_data(signal)

    def __processed_waves(self, waves, channel):
        print(f"SpectrumScreen: Waves data for {channel} - Alpha: {waves.alpha_raw:.4f}, Beta: {waves.beta_raw:.4f}, Theta: {waves.theta_raw:.4f}, Delta: {waves.delta_raw:.4f}, Gamma: {waves.gamma_raw:.4f}")
        match channel:
            case 'O1':
                self.o1_alpha_raw.setText(str(round(waves.alpha_raw, 4)))
                self.o1_beta_raw.setText(str(round(waves.beta_raw, 4)))
                self.o1_theta_raw.setText(str(round(waves.theta_raw, 4)))
                self.o1_delta_raw.setText(str(round(waves.delta_raw, 4)))
                self.o1_gamma_raw.setText(str(round(waves.gamma_raw, 4)))
                self.o1_alpha_percent.setText(str(round(waves.alpha_rel * 100)) + '%')
                self.o1_beta_percent.setText(str(round(waves.beta_rel * 100)) + '%')
                self.o1_theta_percent.setText(str(round(waves.theta_rel * 100)) + '%')
                self.o1_delta_percent.setText(str(round(waves.delta_rel * 100)) + '%')
                self.o1_gamma_percent.setText(str(round(waves.gamma_rel * 100)) + '%')
            case 'O2':
                self.o2_alpha_raw.setText(str(round(waves.alpha_raw, 4)))
                self.o2_beta_raw.setText(str(round(waves.beta_raw, 4)))
                self.o2_theta_raw.setText(str(round(waves.theta_raw, 4)))
                self.o2_delta_raw.setText(str(round(waves.delta_raw, 4)))
                self.o2_gamma_raw.setText(str(round(waves.gamma_raw, 4)))
                self.o2_alpha_percent.setText(str(round(waves.alpha_rel * 100)) + '%')
                self.o2_beta_percent.setText(str(round(waves.beta_rel * 100)) + '%')
                self.o2_theta_percent.setText(str(round(waves.theta_rel * 100)) + '%')
                self.o2_delta_percent.setText(str(round(waves.delta_rel * 100)) + '%')
                self.o2_gamma_percent.setText(str(round(waves.gamma_rel * 100)) + '%')
            case 'T3':
                self.t3_alpha_raw.setText(str(round(waves.alpha_raw, 4)))
                self.t3_beta_raw.setText(str(round(waves.beta_raw, 4)))
                self.t3_theta_raw.setText(str(round(waves.theta_raw, 4)))
                self.t3_delta_raw.setText(str(round(waves.delta_raw, 4)))
                self.t3_gamma_raw.setText(str(round(waves.gamma_raw, 4)))
                self.t3_alpha_percent.setText(str(round(waves.alpha_rel * 100)) + '%')
                self.t3_beta_percent.setText(str(round(waves.beta_rel * 100)) + '%')
                self.t3_theta_percent.setText(str(round(waves.theta_rel * 100)) + '%')
                self.t3_delta_percent.setText(str(round(waves.delta_rel * 100)) + '%')
                self.t3_gamma_percent.setText(str(round(waves.gamma_rel * 100)) + '%')
            case 'T4':
                self.t4_alpha_raw.setText(str(round(waves.alpha_raw, 4)))
                self.t4_beta_raw.setText(str(round(waves.beta_raw, 4)))
                self.t4_theta_raw.setText(str(round(waves.theta_raw, 4)))
                self.t4_delta_raw.setText(str(round(waves.delta_raw, 4)))
                self.t4_gamma_raw.setText(str(round(waves.gamma_raw, 4)))
                self.t4_alpha_percent.setText(str(round(waves.alpha_rel * 100)) + '%')
                self.t4_beta_percent.setText(str(round(waves.beta_rel * 100)) + '%')
                self.t4_theta_percent.setText(str(round(waves.theta_rel * 100)) + '%')
                self.t4_delta_percent.setText(str(round(waves.delta_rel * 100)) + '%')
                self.t4_gamma_percent.setText(str(round(waves.gamma_rel * 100)) + '%')
            case _:
                print('Unknown channel')

    def __processed_spectrum(self, spectrum, channel):
        print(f"SpectrumScreen: Spectrum data for {channel}, length: {len(spectrum)}")
        match channel:
            case 'O1':
                self.o1Graph.update_data(spectrum)
            case 'O2':
                self.o2Graph.update_data(spectrum)
            case 'T3':
                self.t3Graph.update_data(spectrum)
            case 'T4':
                self.t4Graph.update_data(spectrum)
            case _:
                print('Unknown channel')

    def __close_screen(self):
        self.__stop_signal()
        stackNavigation.setCurrentWidget(menuScreen)


app = QApplication(sys.argv)
stackNavigation = QStackedWidget()
menuScreen = MenuScreen()
searchScreen = SearchScreen()
resistScreen = ResistanceScreen()
signalScreen = SignalScreen()
emotionBipolarScreen = EmotionBipolarScreen()
emotionMonopolarScreen = EmotionMonopolarScreen()
spectrumScreen = SpectrumScreen()
stackNavigation.addWidget(menuScreen)
stackNavigation.addWidget(searchScreen)
stackNavigation.addWidget(resistScreen)
stackNavigation.addWidget(signalScreen)
stackNavigation.addWidget(emotionBipolarScreen)
stackNavigation.addWidget(emotionMonopolarScreen)
stackNavigation.addWidget(spectrumScreen)
stackNavigation.setCurrentWidget(menuScreen)
stackNavigation.show()
app.exec()

# Отключаем сенсор только если он не None
if brain_bit_controller is not None:
    brain_bit_controller.disconnect_sensor()
del brain_bit_controller
