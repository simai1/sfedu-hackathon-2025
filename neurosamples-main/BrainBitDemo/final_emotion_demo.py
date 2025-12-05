import sys
import time
from PyQt6.QtWidgets import QApplication
from neuro_impl.sensor_emulator import create_sensor_emulator
from neuro_impl.emotions_bipolar_controller import EmotionBipolar
from neurosdk.cmn_types import SensorState, SensorCommand


class FinalEmotionDemo:
    def __init__(self):
        self.emulator = create_sensor_emulator()
        self.emotion_controller = EmotionBipolar()
        self.setup_connections()
        self.setup_emotion_callbacks()
        self.__last_emotion = None
        
    def setup_connections(self):
        """Настройка соединений для получения данных от эмулятора"""
        self.emulator.sensorStateChanged.connect(self.on_sensor_state_changed)
        self.emulator.signalDataReceived.connect(self.on_signal_received)
        self.emulator.resistDataReceived.connect(self.on_resist_received)
        
    def setup_emotion_callbacks(self):
        """Настройка обратных вызовов для контроллера эмоций"""
        self.emotion_controller.progressCalibrationCallback = self.on_calibration_progress
        self.emotion_controller.isArtifactedSequenceCallback = self.on_artifacted_sequence
        self.emotion_controller.isBothSidesArtifactedCallback = self.on_both_sides_artifacted
        self.emotion_controller.lastMindDataCallback = self.on_mind_data
        self.emotion_controller.lastSpectralDataCallback = self.on_spectral_data
        self.emotion_controller.rawSpectralDataCallback = self.on_raw_spectral_data
        
    def on_sensor_state_changed(self, sensor, state):
        """Обработчик изменения состояния сенсора"""
        print(f"Состояние сенсора изменено: {state}")
        
    def on_signal_received(self, sensor, data):
        """Обработчик получения сигнальных данных"""
        if len(data) > 0:
            # Выводим текущую эмоцию, которую эмулирует сенсор
            current_emotion = self.emulator.get_current_emotion()
            if current_emotion != self.__last_emotion:
                print(f"\n--- ЭМУЛИРУЕМАЯ ЭМОЦИЯ ИЗМЕНИЛАСЬ НА: {current_emotion.upper()} ---")
                self.__last_emotion = current_emotion
                
    def on_resist_received(self, sensor, data):
        """Обработчик получения данных о сопротивлении"""
        print(f"Сопротивление - O1: {data.O1}, O2: {data.O2}, T3: {data.T3}, T4: {data.T4}")
        
    def on_calibration_progress(self, progress):
        """Обработчик прогресса калибровки"""
        print(f"Прогресс калибровки: {progress}%")
        
    def on_artifacted_sequence(self, artifacted):
        """Обработчик артефактов последовательности"""
        print(f"Артефакты последовательности: {artifacted}")
        
    def on_both_sides_artifacted(self, artifacted):
        """Обработчик артефактов с обеих сторон"""
        print(f"Артефакты с обеих сторон: {artifacted}")
        
    def on_mind_data(self, data):
        """Обработчик ментальных данных"""
        # Определяем эмоцию на основе ментальных данных
        attention = data.rel_attention
        relaxation = data.rel_relaxation
        
        # Простая логика определения эмоции
        if relaxation > 60 and attention < 40:
            detected_emotion = "расслабленное"
        elif attention > 60 and relaxation < 40:
            detected_emotion = "сосредоточенное"
        elif attention > 50 and relaxation > 50:
            detected_emotion = "возбужденное"
        elif attention < 30 and relaxation < 30:
            detected_emotion = "сонное"
        else:
            detected_emotion = "нейтральное"
            
        current_emotion = self.emulator.get_current_emotion()
        print(f"ОПРЕДЕЛЕННАЯ ЭМОЦИЯ: {detected_emotion} (эмулируемая: {current_emotion})")
        print(f"Ментальные данные - Внимание: {data.rel_attention:.2f}%, Расслабление: {data.rel_relaxation:.2f}%")
        
    def on_spectral_data(self, spectral_data):
        """Обработчик спектральных данных"""
        print(f"Спектральные данные - Дельта: {spectral_data.delta*100:.2f}%, Тета: {spectral_data.theta*100:.2f}%, Альфа: {spectral_data.alpha*100:.2f}%, Бета: {spectral_data.beta*100:.2f}%, Гамма: {spectral_data.gamma*100:.2f}%")
        
    def on_raw_spectral_data(self, spect_vals):
        """Обработчик сырых спектральных данных"""
        print(f"Сырые спектральные данные - Альфа: {spect_vals.alpha:.2f}, Бета: {spect_vals.beta:.2f}")
        
    def run_demo(self):
        """Запуск демонстрации определения эмоций"""
        print("=== ФИНАЛЬНАЯ ДЕМОНСТРАЦИЯ ОПРЕДЕЛЕНИЯ ЭМОЦИЙ ===")
        print("Этот пример показывает, как определяются эмоции по показаниям датчиков")
        print("Эмулятор будет менять эмоции каждые 500 семплов")
        print("Контроллер эмоций будет определять эмоции на основе ментальных данных")
        print()
        
        # Подключаемся к эмулятору
        print("Подключение к эмулятору...")
        self.emulator.connect()
        time.sleep(1)
        
        # Запускаем измерение сопротивления
        print("Запуск измерения сопротивления...")
        self.emulator.start_resist()
        time.sleep(3)
        self.emulator.stop_resist()
        
        # Начинаем калибровку через контроллер эмоций
        print("Начало калибровки через контроллер эмоций...")
        self.emotion_controller.start_calibration()
        
        # Запускаем сигнал
        print("Запуск сигнала...")
        self.emulator.start_signal()
        
        # Ждем некоторое время, чтобы пронаблюдать за изменением эмоций
        print("\nНаблюдение за эмоциями (ожидание 30 секунд)...")
        for i in range(30):  # Ждем 30 секунд с проверкой каждую секунду
            time.sleep(1)
            if i % 5 == 0:  # Выводим сообщение каждые 5 секунд
                print(f"Прошло {i} секунд...")
        
        # Останавливаем сигнал
        self.emulator.stop_signal()
        print("\nДемонстрация завершена")
        print("\nВЫВОД:")
        print("1. Эмулятор генерирует сигналы, соответствующие разным эмоциональным состояниям")
        print("2. Каждые 500 семплов эмулятор меняет эмоцию в следующем порядке:")
        print("   neutral -> relaxed -> focused -> anxious -> drowsy -> neutral (цикл)")
        print("3. Контроллер эмоций анализирует сигналы и определяет эмоции на основе:")
        print("   - Альфа волн (расслабление)")
        print("   - Бета волн (внимание)")
        print("   - Тета волн (сонливость)")
        print("   - Дельта волн (глубокий сон)")


def main():
    app = QApplication(sys.argv)
    demo = FinalEmotionDemo()
    demo.run_demo()
    app.quit()


if __name__ == "__main__":
    main()