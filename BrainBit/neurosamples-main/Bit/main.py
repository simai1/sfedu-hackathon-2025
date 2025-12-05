import sys
import os

from PyQt6.QtWidgets import QApplication, QMainWindow, QStackedWidget, QWidget
from PyQt6.uic import loadUi
from neurosdk.cmn_types import SensorState

# Определяем базовый путь для ресурсов (работает и в exe, и в обычном режиме)
def resource_path(relative_path):
    """Получить абсолютный путь к ресурсу, работает для dev и PyInstaller"""
    try:
        # PyInstaller создает временную папку и сохраняет путь в _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

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
        loadUi(resource_path("ui/MenuScreenWithEmulatorUI.ui"), self)
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


class SearchScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi(resource_path("ui/SearchScreenRuUI.ui"), self)
        self.is_searching = False
        self.sensorsList = None
        self.refreshButton.clicked.connect(self.__refresh_search)
        self.exitButton.clicked.connect(self.__exit_application)
        self.disconnectButton.clicked.connect(self.__disconnect_device)
        self.listWidget.itemClicked.connect(self.__connect_to_sensor)
        # Подключаемся к сигналу изменения состояния подключения
        brain_bit_controller.sensorConnectionState.connect(self.__on_connection_state_changed)
        # Проверяем начальное состояние и показываем/скрываем кнопку отключения
        self.__update_disconnect_button()
        # Автоматически запускаем поиск при инициализации
        self.__start_scan()
    
    def __on_connection_state_changed(self, state):
        """Обработка изменения состояния подключения"""
        self.__update_disconnect_button()
    
    def __update_disconnect_button(self):
        """Обновление видимости кнопки отключения"""
        is_connected = brain_bit_controller.is_sensor_connected()
        self.disconnectButton.setVisible(is_connected)
    
    def __disconnect_device(self):
        """Отключение устройства"""
        brain_bit_controller.disconnect_sensor()
        self.__update_disconnect_button()
        self.__refresh_search()

    def __search(self):
        if self.is_searching:
            self.__stop_scan()
        else:
            self.__start_scan()

    def __sensors_founded(self, sensors):
        self.sensorsList = sensors
        self.listWidget.clear()
        if sensors:
            self.listWidget.addItems([sens.Name + ' (' + sens.SerialNumber + ')' for sens in sensors])
            self.statusLabel.setText(f"Найдено устройств: {len(sensors)}. Нажмите на устройство для подключения")
        else:
            self.statusLabel.setText("Устройства не найдены. Поиск продолжается...")

    def __connect_to_sensor(self, item):
        item_number = self.listWidget.row(item)
        # Показываем лоадер подключения
        self.statusLabel.setText("Подключение к устройству...")
        self.listWidget.setEnabled(False)
        # Сохраняем текущий экран в статусах для возврата
        if hasattr(statusScreen, 'previous_screen'):
            statusScreen.previous_screen = self
        # Подключаемся к сигналу только один раз
        try:
            brain_bit_controller.sensorConnectionState.disconnect(self.__is_sensor_connected)
        except:
            pass
        brain_bit_controller.sensorConnectionState.connect(self.__is_sensor_connected)
        brain_bit_controller.create_and_connect(sensor_info=self.sensorsList[item_number])

    def __is_sensor_connected(self, sensor_state):
        if sensor_state == SensorState.StateInRange:
            # Автоматически переходим на экран монополярных эмоций и запускаем калибровку
            try:
                brain_bit_controller.sensorConnectionState.disconnect(self.__is_sensor_connected)
            except Exception:
                pass
            self.__stop_scan()
            # Сохраняем текущий экран в статусах для возврата
            if hasattr(statusScreen, 'previous_screen'):
                statusScreen.previous_screen = self
            stackNavigation.setCurrentWidget(emotionMonopolarScreen)
            # Запускаем калибровку автоматически
            emotionMonopolarScreen.auto_start_calibration()
        else:
            self.statusLabel.setText("Ошибка подключения. Попробуйте снова.")
            self.listWidget.setEnabled(True)

    def __start_scan(self):
        self.statusLabel.setText("Поиск устройств...")
        brain_bit_controller.sensorsFounded = self.__sensors_founded
        brain_bit_controller.start_scan()
        self.is_searching = True

    def __stop_scan(self):
        brain_bit_controller.stop_scan()
        brain_bit_controller.sensorsFounded = None
        self.is_searching = False

    def __refresh_search(self):
        """Обновление поиска устройств"""
        # Останавливаем текущий поиск, если он идет
        if self.is_searching:
            self.__stop_scan()
        # Очищаем список устройств
        self.listWidget.clear()
        self.sensorsList = None
        # Включаем список обратно (на случай если он был отключен)
        self.listWidget.setEnabled(True)
        # Запускаем новый поиск
        self.__start_scan()

    def __exit_application(self):
        """Закрытие приложения"""
        # Останавливаем поиск перед выходом
        if self.is_searching:
            self.__stop_scan()
        # Отключаем устройство, если подключено
        brain_bit_controller.disconnect_sensor()
        # Закрываем приложение
        QApplication.instance().quit()


class ResistanceScreen(QMainWindow):
    normal_resist_border = 2_000_000

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi(resource_path("ui/ResistanceScreenRuUI.ui"), self)
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
        loadUi(resource_path("ui/SignalScreenRuUI.ui"), self)
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
        try:
            o1Samples = [sample.O1 for sample in signal]
            o2Samples = [sample.O2 for sample in signal]
            t3Samples = [sample.T3 for sample in signal]
            t4Samples = [sample.T4 for sample in signal]
            self.o1Graph.update_data(o1Samples)
            self.o2Graph.update_data(o2Samples)
            self.t3Graph.update_data(t3Samples)
            self.t4Graph.update_data(t4Samples)
        except RuntimeError as e:
            # Игнорируем ошибки, связанные с уже удалёнными объектами
            if "wrapped C/C++ object" in str(e):
                pass
            else:
                raise

    def __start_signal(self):
        self.signalButton.setText('Stop')
        try:
            self.o1Graph.start_draw()
            self.o2Graph.start_draw()
            self.t3Graph.start_draw()
            self.t4Graph.start_draw()
        except RuntimeError as e:
            # Игнорируем ошибки, связанные с уже удалёнными объектами
            if "wrapped C/C++ object" in str(e):
                pass
            else:
                raise
        brain_bit_controller.signalReceived = self.signal_received
        brain_bit_controller.start_signal()
        self.__is_started = True

    def __stop_signal(self):
        self.signalButton.setText('Start')
        try:
            self.o1Graph.stop_draw()
            self.o2Graph.stop_draw()
            self.t3Graph.stop_draw()
            self.t4Graph.stop_draw()
        except RuntimeError as e:
            # Игнорируем ошибки, связанные с уже удалёнными объектами
            if "wrapped C/C++ object" in str(e):
                pass
            else:
                raise
        brain_bit_controller.stop_signal()
        brain_bit_controller.resistReceived = None
        self.__is_started = False

    def __close_screen(self):
        self.__stop_signal()
        # Очищаем графики перед закрытием экрана
        if hasattr(self, 'o1Graph'):
            self.o1Graph.cleanup()
        if hasattr(self, 'o2Graph'):
            self.o2Graph.cleanup()
        if hasattr(self, 't3Graph'):
            self.t3Graph.cleanup()
        if hasattr(self, 't4Graph'):
            self.t4Graph.cleanup()
        stackNavigation.setCurrentWidget(menuScreen)


class EmotionBipolarScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi(resource_path("ui/EmotionBipolarScreenRuUI.ui"), self)
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
        self.emotionController.stop_calibration()  # Останавливаем калибровку
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
        loadUi(resource_path("ui/EmotionMonopolarScreenRuUI.ui"), self)
        self.backButton.clicked.connect(self.__close_screen)
        self.refreshButton.clicked.connect(self.__refresh_calibration)
        self.is_started = False
        self.calibration_completed = False
        self.calibrated_channels = {'O1': False, 'O2': False, 'T3': False, 'T4': False}

        self.emotionController = EmotionMonopolar()
        self.emotionController.progressCalibrationCallback = self.calibration_callback
        self.emotionController.isArtifactedSequenceCallback = self.is_artifacted_sequence_callback
        self.emotionController.isBothSidesArtifactedCallback = self.is_both_sides_artifacted_callback
        self.emotionController.lastMindDataCallback = self.mind_data_callback
        self.emotionController.lastSpectralDataCallback = self.last_spectral_data_callback
        self.emotionController.rawSpectralDataCallback = self.raw_spectral_data_callback

    def auto_start_calibration(self):
        """Автоматический запуск калибровки после подключения устройства"""
        if not self.is_started:
            self.__start_signal()

    def __refresh_calibration(self):
        """Обновление калибровки - прерывает процесс и начинает заново"""
        # Останавливаем текущий процесс
        if self.is_started:
            self.__stop_signal()
        # Сбрасываем прогресс-бары
        self.o1calibrationProgress.setValue(0)
        self.o2calibrationProgress.setValue(0)
        self.t3calibrationProgress.setValue(0)
        self.t4calibrationProgress.setValue(0)
        # Запускаем заново
        self.__start_signal()

    def __start_signal(self):
        self.emotionController.start_calibration()
        brain_bit_controller.signalReceived = self.emotionController.process_data
        brain_bit_controller.start_signal()
        self.is_started = True

    def __stop_signal(self):
        self.emotionController.stop_calibration()  # Останавливаем калибровку
        brain_bit_controller.stop_signal()
        brain_bit_controller.signalReceived = None
        self.is_started = False
        # Сбрасываем флаги калибровки при остановке
        self.calibration_completed = False
        self.calibrated_channels = {'O1': False, 'O2': False, 'T3': False, 'T4': False}

    def calibration_callback(self, progress, channel):
        print(f"EmotionMonopolarScreen: Calibration progress for {channel}: {progress}%")
        match channel:
            case 'O1':
                self.o1calibrationProgress.setValue(progress)
                if progress >= 100:
                    self.calibrated_channels['O1'] = True
            case 'O2':
                self.o2calibrationProgress.setValue(progress)
                if progress >= 100:
                    self.calibrated_channels['O2'] = True
            case 'T3':
                self.t3calibrationProgress.setValue(progress)
                if progress >= 100:
                    self.calibrated_channels['T3'] = True
            case 'T4':
                self.t4calibrationProgress.setValue(progress)
                if progress >= 100:
                    self.calibrated_channels['T4'] = True
            case _:
                print('Unknown channel')
        
        # Проверяем, завершена ли калибровка всех каналов
        if all(self.calibrated_channels.values()) and not self.calibration_completed:
            self.calibration_completed = True
            print("EmotionMonopolarScreen: All channels calibrated, moving to token screen")
            # НЕ останавливаем сигнал - данные продолжают выводиться в консоль
            # Сохраняем текущий экран в статусах для возврата
            if hasattr(statusScreen, 'previous_screen'):
                statusScreen.previous_screen = self
            # Просто переключаем интерфейс на экран ввода токена
            stackNavigation.setCurrentWidget(tokenScreen)

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
        # Возвращаемся на предыдущий экран, если он был сохранен, иначе на статусы
        if hasattr(statusScreen, 'previous_screen') and statusScreen.previous_screen:
            stackNavigation.setCurrentWidget(statusScreen.previous_screen)
            statusScreen.previous_screen = None
        else:
            self.__stop_signal()
            stackNavigation.setCurrentWidget(statusScreen)


class TokenScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi(resource_path("ui/TokenScreenRuUI.ui"), self)
        self.backButton.clicked.connect(self.__close_screen)
        self.connectButton.clicked.connect(self.__connect_to_backend)
        self.token = None

    def __connect_to_backend(self):
        token = self.tokenInput.text().strip()
        if token:
            self.token = token
            print(f"TokenScreen: Token entered: {token}")
            # Переходим на экран статусов
            stackNavigation.setCurrentWidget(statusScreen)
            # Обновляем статусы на экране статусов
            statusScreen.update_statuses(device_connected=True, calibrated=True, backend_connected=True)
        else:
            print("TokenScreen: Token is empty")

    def __close_screen(self):
        stackNavigation.setCurrentWidget(emotionMonopolarScreen)


class StatusScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi(resource_path("ui/StatusScreenRuUI.ui"), self)
        self.backButton.clicked.connect(self.__close_screen)
        self.disconnectButton.clicked.connect(self.__disconnect_device)
        self.device_connected = False
        self.calibrated = False
        self.backend_connected = False
        self.previous_screen = None  # Сохраняем предыдущий экран для возврата
        
        # Делаем статусы кликабельными
        self.deviceStatusItem.mousePressEvent = lambda e: self.__on_status_clicked('device')
        self.calibrationStatusItem.mousePressEvent = lambda e: self.__on_status_clicked('calibration')
        self.backendStatusItem.mousePressEvent = lambda e: self.__on_status_clicked('backend')

    def __on_status_clicked(self, status_type):
        """Обработка клика на статус"""
        # Сохраняем текущий экран как предыдущий
        self.previous_screen = stackNavigation.currentWidget()
        
        if status_type == 'device':
            # Если устройство подключено, переходим на экран статусов (остаемся здесь)
            # Если не подключено, переходим на экран поиска
            if self.device_connected:
                # Устройство подключено - остаемся на экране статусов
                pass
            else:
                # Устройство не подключено - переходим на поиск
                stackNavigation.setCurrentWidget(searchScreen)
                searchScreen.__refresh_search()
        elif status_type == 'calibration':
            # Переходим на экран калибровки и обновляем
            stackNavigation.setCurrentWidget(emotionMonopolarScreen)
            emotionMonopolarScreen.__refresh_calibration()
        elif status_type == 'backend':
            # Переходим на экран токена
            stackNavigation.setCurrentWidget(tokenScreen)

    def __disconnect_device(self):
        """Отключение устройства и возврат к поиску"""
        brain_bit_controller.disconnect_sensor()
        stackNavigation.setCurrentWidget(searchScreen)
        # Перезапускаем поиск
        searchScreen.__refresh_search()

    def update_statuses(self, device_connected=False, calibrated=False, backend_connected=False):
        """Обновление статусов на экране"""
        self.device_connected = device_connected
        self.calibrated = calibrated
        self.backend_connected = backend_connected
        
        # Обновляем отображение статусов устройства
        self.deviceStatusValue.setText("Да" if device_connected else "Нет")
        status_style = "true" if device_connected else "false"
        self.deviceStatusValue.setProperty("statusValue", status_style)
        self.deviceStatusIcon.setText("✓" if device_connected else "✗")
        self.deviceStatusIcon.setProperty("statusIcon", status_style)
        self.deviceStatusValue.setStyleSheet(f"""
            QLabel {{
                font-size: 16px;
                font-weight: 600;
                color: {'#4DA1FF' if device_connected else '#999999'};
                margin: 0;
                padding: 6px 12px;
                background: {'rgba(77, 161, 255, 0.1)' if device_connected else 'rgba(153, 153, 153, 0.1)'};
                border: 1px solid {'rgba(77, 161, 255, 0.2)' if device_connected else 'rgba(153, 153, 153, 0.2)'};
                border-radius: 6px;
            }}
        """)
        self.deviceStatusIcon.setStyleSheet(f"""
            QLabel {{
                font-size: 20px;
                color: {'#4DA1FF' if device_connected else '#999999'};
                font-weight: bold;
            }}
        """)
        
        # Обновляем отображение статусов калибровки
        self.calibrationStatusValue.setText("Да" if calibrated else "Нет")
        status_style = "true" if calibrated else "false"
        self.calibrationStatusValue.setProperty("statusValue", status_style)
        self.calibrationStatusIcon.setText("✓" if calibrated else "✗")
        self.calibrationStatusIcon.setProperty("statusIcon", status_style)
        self.calibrationStatusValue.setStyleSheet(f"""
            QLabel {{
                font-size: 16px;
                font-weight: 600;
                color: {'#4DA1FF' if calibrated else '#999999'};
                margin: 0;
                padding: 6px 12px;
                background: {'rgba(77, 161, 255, 0.1)' if calibrated else 'rgba(153, 153, 153, 0.1)'};
                border: 1px solid {'rgba(77, 161, 255, 0.2)' if calibrated else 'rgba(153, 153, 153, 0.2)'};
                border-radius: 6px;
            }}
        """)
        self.calibrationStatusIcon.setStyleSheet(f"""
            QLabel {{
                font-size: 20px;
                color: {'#4DA1FF' if calibrated else '#999999'};
                font-weight: bold;
            }}
        """)
        
        # Обновляем отображение статусов бэка
        self.backendStatusValue.setText("Да" if backend_connected else "Нет")
        status_style = "true" if backend_connected else "false"
        self.backendStatusValue.setProperty("statusValue", status_style)
        self.backendStatusIcon.setText("✓" if backend_connected else "✗")
        self.backendStatusIcon.setProperty("statusIcon", status_style)
        self.backendStatusValue.setStyleSheet(f"""
            QLabel {{
                font-size: 16px;
                font-weight: 600;
                color: {'#4DA1FF' if backend_connected else '#999999'};
                margin: 0;
                padding: 6px 12px;
                background: {'rgba(77, 161, 255, 0.1)' if backend_connected else 'rgba(153, 153, 153, 0.1)'};
                border: 1px solid {'rgba(77, 161, 255, 0.2)' if backend_connected else 'rgba(153, 153, 153, 0.2)'};
                border-radius: 6px;
            }}
        """)
        self.backendStatusIcon.setStyleSheet(f"""
            QLabel {{
                font-size: 20px;
                color: {'#4DA1FF' if backend_connected else '#999999'};
                font-weight: bold;
            }}
        """)

    def __close_screen(self):
        # Возвращаемся на предыдущий экран, если он был сохранен, иначе на токен
        if hasattr(statusScreen, 'previous_screen') and statusScreen.previous_screen:
            stackNavigation.setCurrentWidget(statusScreen.previous_screen)
            statusScreen.previous_screen = None
        else:
            stackNavigation.setCurrentWidget(tokenScreen)


class SpectrumScreen(QMainWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        loadUi(resource_path("ui/SpectrumScreenRuUI.ui"), self)
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
        try:
            self.o1Graph.start_draw()
            self.o2Graph.start_draw()
            self.t3Graph.start_draw()
            self.t4Graph.start_draw()
        except RuntimeError as e:
            # Игнорируем ошибки, связанные с уже удалёнными объектами
            if "wrapped C/C++ object" in str(e):
                pass
            else:
                raise
        brain_bit_controller.signalReceived = self.__signal_received
        brain_bit_controller.start_signal()
        self.__is_started = True

    def __stop_signal(self):
        self.signalButton.setText('Start')
        try:
            self.o1Graph.stop_draw()
            self.o2Graph.stop_draw()
            self.t3Graph.stop_draw()
            self.t4Graph.stop_draw()
        except RuntimeError as e:
            # Игнорируем ошибки, связанные с уже удалёнными объектами
            if "wrapped C/C++ object" in str(e):
                pass
            else:
                raise
        brain_bit_controller.stop_signal()
        brain_bit_controller.signalReceived = None
        self.__is_started = False

    def __signal_received(self, signal):
        try:
            self.spectrumController.process_data(signal)
        except RuntimeError as e:
            # Игнорируем ошибки, связанные с уже удалёнными объектами
            if "wrapped C/C++ object" in str(e):
                pass
            else:
                raise

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
        try:
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
        except RuntimeError as e:
            # Игнорируем ошибки, связанные с уже удалёнными объектами
            if "wrapped C/C++ object" in str(e):
                pass
            else:
                raise

    def __close_screen(self):
        self.__stop_signal()
        # Очищаем графики перед закрытием экрана
        if hasattr(self, 'o1Graph'):
            self.o1Graph.cleanup()
        if hasattr(self, 'o2Graph'):
            self.o2Graph.cleanup()
        if hasattr(self, 't3Graph'):
            self.t3Graph.cleanup()
        if hasattr(self, 't4Graph'):
            self.t4Graph.cleanup()
        stackNavigation.setCurrentWidget(menuScreen)


def main():
    """Главная функция приложения"""
    global stackNavigation, menuScreen, searchScreen, resistScreen, signalScreen
    global emotionBipolarScreen, emotionMonopolarScreen, tokenScreen, statusScreen, spectrumScreen
    
    try:
        app = QApplication(sys.argv)
        stackNavigation = QStackedWidget()
        
        print("[INFO] Инициализация экранов...")
        menuScreen = MenuScreen()
        searchScreen = SearchScreen()
        resistScreen = ResistanceScreen()
        signalScreen = SignalScreen()
        emotionBipolarScreen = EmotionBipolarScreen()
        emotionMonopolarScreen = EmotionMonopolarScreen()
        tokenScreen = TokenScreen()
        statusScreen = StatusScreen()
        spectrumScreen = SpectrumScreen()
        
        print("[INFO] Добавление виджетов в стек...")
        stackNavigation.addWidget(menuScreen)
        stackNavigation.addWidget(searchScreen)
        stackNavigation.addWidget(resistScreen)
        stackNavigation.addWidget(signalScreen)
        stackNavigation.addWidget(emotionBipolarScreen)
        stackNavigation.addWidget(emotionMonopolarScreen)
        stackNavigation.addWidget(tokenScreen)
        stackNavigation.addWidget(statusScreen)
        stackNavigation.addWidget(spectrumScreen)
        
        print("[INFO] Показ главного окна...")
        stackNavigation.setCurrentWidget(searchScreen)
        stackNavigation.show()
        
        print("[INFO] Запуск приложения...")
        exit_code = app.exec()
        
        # Очищаем графики перед завершением программы
        try:
            if hasattr(signalScreen, 'o1Graph'):
                signalScreen.o1Graph.cleanup()
            if hasattr(signalScreen, 'o2Graph'):
                signalScreen.o2Graph.cleanup()
            if hasattr(signalScreen, 't3Graph'):
                signalScreen.t3Graph.cleanup()
            if hasattr(signalScreen, 't4Graph'):
                signalScreen.t4Graph.cleanup()
            if hasattr(spectrumScreen, 'o1Graph'):
                spectrumScreen.o1Graph.cleanup()
            if hasattr(spectrumScreen, 'o2Graph'):
                spectrumScreen.o2Graph.cleanup()
            if hasattr(spectrumScreen, 't3Graph'):
                spectrumScreen.t3Graph.cleanup()
            if hasattr(spectrumScreen, 't4Graph'):
                spectrumScreen.t4Graph.cleanup()
        except Exception as e:
            print(f"Ошибка при очистке графиков: {e}")
        
        # Отключаем сенсор только если он не None
        try:
            if brain_bit_controller is not None:
                brain_bit_controller.disconnect_sensor()
        except Exception as e:
            print(f"Ошибка при отключении сенсора: {e}")
        
        return exit_code
    except Exception as e:
        print(f"[ERROR] Критическая ошибка при запуске приложения: {e}")
        import traceback
        traceback.print_exc()
        input("Нажмите Enter для выхода...")
        return 1

if __name__ == "__main__":
    sys.exit(main())

