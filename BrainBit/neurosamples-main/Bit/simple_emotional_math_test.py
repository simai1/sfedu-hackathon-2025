import sys
import time
import math
import random
from PyQt6.QtWidgets import QApplication
from em_st_artifacts.emotional_math import EmotionalMath
from em_st_artifacts.utils.lib_settings import MathLibSetting, ArtifactDetectSetting, MentalAndSpectralSetting
from em_st_artifacts.utils.support_classes import RawChannels


class SimpleEmotionalMathTest:
    def __init__(self):
        self.setup_emotional_math()
        
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
        
    def generate_test_data(self, num_samples=25):
        """Генерация тестовых данных, имитирующих реальные сигналы"""
        bipolar_samples = []
        t = 0
        for _ in range(num_samples):
            # Создаем комбинацию различных волн
            # Альфа волны (8-12 Гц) - доминируют когда человек расслаблен
            alpha_wave = 50 * math.sin(2 * math.pi * 10 * t)
            
            # Бета волны (13-30 Гц) - доминируют когда человек сосредоточен
            beta_wave = 30 * math.sin(2 * math.pi * 20 * t)
            
            # Тета волны (4-7 Гц) - связаны с сонливостью, медитацией
            theta_wave = 20 * math.sin(2 * math.pi * 6 * t)
            
            # Дельта волны (0.5-3 Гц) - глубокий сон
            delta_wave = 10 * math.sin(2 * math.pi * 2 * t)
            
            # Добавляем меньший шум для реалистичности
            noise = random.uniform(-5, 5)
            
            # Создаем биполярные каналы
            left_bipolar = alpha_wave + beta_wave * 0.5 + theta_wave * 0.3 + delta_wave * 0.1 + noise
            right_bipolar = alpha_wave * 0.9 + beta_wave * 0.6 + theta_wave * 0.2 + delta_wave * 0.15 + noise
            
            bipolar_samples.append(RawChannels(left_bipolar, right_bipolar))
            t += 0.004  # При частоте дискретизации 250 Гц, шаг времени 1/250 = 0.004 сек
            
        return bipolar_samples
        
    def run_test(self):
        """Запуск теста калибровки"""
        print("=== Тест калибровки EmotionalMath ===")
        
        # Начинаем калибровку
        print("Начало калибровки...")
        self.math.start_calibration()
        
        # Генерируем и передаем данные в течение 60 секунд
        print("Генерация и передача данных...")
        for i in range(120):  # 120 итераций по 0.5 секунды = 60 секунд
            # Генерируем данные
            data = self.generate_test_data()
            
            # Передаем данные в библиотеку
            self.math.push_bipolars(data)
            self.math.process_data_arr()
            
            # Проверяем прогресс калибровки
            if not self.math.calibration_finished():
                progress = self.math.get_calibration_percents()
                print(f"Прогресс калибровки: {progress}%")
            else:
                print("Калибровка завершена!")
                break
                
            # Ждем 0.5 секунды
            time.sleep(0.5)
            
        print("Тест завершен")


def main():
    app = QApplication(sys.argv)
    test = SimpleEmotionalMathTest()
    test.run_test()
    app.quit()


if __name__ == "__main__":
    main()