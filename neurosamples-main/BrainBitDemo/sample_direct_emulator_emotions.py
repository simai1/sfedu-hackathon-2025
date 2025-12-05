import sys
import time
from PyQt6.QtWidgets import QApplication
from neuro_impl.sensor_emulator import create_sensor_emulator
from em_st_artifacts.emotional_math import EmotionalMath
from em_st_artifacts.utils.lib_settings import MathLibSetting, ArtifactDetectSetting, MentalAndSpectralSetting
from em_st_artifacts.utils.support_classes import RawChannels
from neurosdk.cmn_types import SensorState, SensorCommand


class DirectEmulatorWithEmotionsDemo:
    def __init__(self):
        self.emulator = create_sensor_emulator()
        self.setup_emotional_math()
        self.setup_connections()
        
    def setup_emotional_math(self):
        """Настройка библиотеки EmotionalMath"""
        mls = MathLibSetting(sampling_rate=250,
                             process_win_freq=25,
                             n_first_sec_skipped=4,
                             fft_window=1000,
                             bipolar_mode=True,
                             channels_number=4,
                             channel_for_analysis=0)
        ads = ArtifactDetectSetting(art_bord=110,
                                    allowed_percent_artpoints=70,
                                    raw_betap_limit=800_000,
                                    global_artwin_sec=4,
                                    num_wins_for_quality_avg=125,
                                    hamming_win_spectrum=True,
                                    hanning_win_spectrum=False,
                                    total_pow_border=100,
                                    spect_art_by_totalp=True)
        mss = MentalAndSpectralSetting(n_sec_for_averaging=2,
                                       n_sec_for_instant_estimation=4)
        calibration_length = 6
        nwins_skip_after_artifact = 10

        self.math = EmotionalMath(mls, ads, mss)
        self.math.set_calibration_length(calibration_length)
        self.math.set_mental_estimation_mode(False)
        self.math.set_skip_wins_after_artifact(nwins_skip_after_artifact)
        self.math.set_zero_spect_waves(True, 0, 1, 1, 1, 0)
        self.math.set_spect_normalization_by_bands_width(True)
        
    def setup_connections(self):
        """Настройка соединений для получения данных от эмулятора"""
        self.emulator.sensorStateChanged.connect(self.on_sensor_state_changed)
        self.emulator.signalDataReceived.connect(self.on_signal_received)
        self.emulator.resistDataReceived.connect(self.on_resist_received)
        
    def on_sensor_state_changed(self, sensor, state):
        """Обработчик изменения состояния сенсора"""
        print(f"Состояние сенсора изменено: {state}")
        
    def on_signal_received(self, sensor, data):
        """Обработчик получения сигнальных данных"""
        if len(data) > 0:
            sample = data[0]
            print(f"Получены сигнальные данные - O1: {sample.O1:.2f}, O2: {sample.O2:.2f}, T3: {sample.T3:.2f}, T4: {sample.T4:.2f}")
            
            # Преобразуем данные в формат, понятный библиотеке EmotionalMath
            bipolar_samples = []
            for sample in data:
                left_bipolar = sample.T3 - sample.O1
                right_bipolar = sample.T4 - sample.O2
                bipolar_samples.append(RawChannels(left_bipolar, right_bipolar))
            
            # Передаем данные напрямую в библиотеку EmotionalMath
            print("Передача данных в EmotionalMath...")
            self.math.push_bipolars(bipolar_samples)
            self.math.process_data_arr()
            
            # Проверяем прогресс калибровки
            if not self.math.calibration_finished():
                progress = self.math.get_calibration_percents()
                print(f"Прогресс калибровки: {progress}%")
            else:
                print("Калибровка завершена!")
                
    def on_resist_received(self, sensor, data):
        """Обработчик получения данных о сопротивлении"""
        print(f"Сопротивление - O1: {data.O1}, O2: {data.O2}, T3: {data.T3}, T4: {data.T4}")
        
    def run_demo(self):
        """Запуск демонстрации прямой работы с EmotionalMath"""
        print("=== Демонстрация прямой работы с EmotionalMath ===")
        
        # Подключаемся к эмулятору
        print("Подключение к эмулятору...")
        self.emulator.connect()
        time.sleep(1)
        
        # Запускаем измерение сопротивления
        print("Запуск измерения сопротивления...")
        self.emulator.start_resist()
        time.sleep(3)
        self.emulator.stop_resist()
        
        # Начинаем калибровку через EmotionalMath
        print("Начало калибровки через EmotionalMath...")
        self.math.start_calibration()
        
        # Запускаем сигнал
        print("Запуск сигнала...")
        self.emulator.start_signal()
        
        # Ждем некоторое время, чтобы калибровка успела продвинуться
        print("Ожидание прогресса калибровки...")
        for i in range(30):  # Ждем 30 секунд с проверкой каждую секунду
            time.sleep(1)
            print(f"Прошло {i+1} секунд...")
        
        # Останавливаем сигнал
        self.emulator.stop_signal()
        print("Демонстрация завершена")


def main():
    app = QApplication(sys.argv)
    demo = DirectEmulatorWithEmotionsDemo()
    demo.run_demo()
    app.quit()


if __name__ == "__main__":
    main()