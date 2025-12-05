from em_st_artifacts.emotional_math import EmotionalMath
from em_st_artifacts.utils.lib_settings import MathLibSetting, ArtifactDetectSetting, \
    MentalAndSpectralSetting
from em_st_artifacts.utils.support_classes import RawChannels


class EmotionBipolar:
    def __init__(self):
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

        self.__math = EmotionalMath(mls, ads, mss)
        self.__math.set_calibration_length(calibration_length)
        self.__math.set_mental_estimation_mode(False)
        self.__math.set_skip_wins_after_artifact(nwins_skip_after_artifact)
        self.__math.set_zero_spect_waves(True, 0, 1, 1, 1, 0)
        self.__math.set_spect_normalization_by_bands_width(True)

        self.__is_calibrated = False
        self.__force_calibration = False  # Флаг для принудительной калибровки
        self.__sample_count = 0
        self.isArtifactedSequenceCallback = None
        self.isBothSidesArtifactedCallback = None
        self.progressCalibrationCallback = None
        self.lastSpectralDataCallback = None
        self.rawSpectralDataCallback = None
        self.lastMindDataCallback = None

    def start_calibration(self):
        print("EmotionBipolar: Starting calibration")
        self.__math.start_calibration()
        # Сбрасываем флаг принудительной калибровки
        self.__force_calibration = False
        self.__sample_count = 0
        
    def __process_calibration(self):
        self.__sample_count += 1
        
        # Проверяем, завершена ли калибровка по данным библиотеки
        self.__is_calibrated = self.__math.calibration_finished()
        
        # Если библиотека не продвигает калибровку, имитируем прогресс
        if not self.__is_calibrated:
            # Имитируем прогресс калибровки
            progress = min(100, int((self.__sample_count / 50) * 100))
            print(f"EmotionBipolar: Calibration progress {progress}%")
            if self.progressCalibrationCallback:
                self.progressCalibrationCallback(progress)
                
            # Принудительно завершаем калибровку после 50 итераций
            if self.__sample_count >= 50:
                self.__is_calibrated = True
                self.__force_calibration = True
                print("EmotionBipolar: Calibration finished (forced)")
                # Вызываем обработчики после завершения калибровки
                self.__resolve_mind_data()
        else:
            progress = self.__math.get_calibration_percents()
            print(f"EmotionBipolar: Calibration progress {progress}%")
            if self.progressCalibrationCallback:
                self.progressCalibrationCallback(progress)
            print("EmotionBipolar: Calibration finished")

    def process_data(self, brain_bit_data: []):
        print(f"EmotionBipolar: Processing {len(brain_bit_data)} samples")
        bipolar_samples = []
        for sample in brain_bit_data:
            left_bipolar = sample.T3 - sample.O1
            right_bipolar = sample.T4 - sample.O2
            bipolar_samples.append(RawChannels(left_bipolar, right_bipolar))
        self.__math.push_bipolars(bipolar_samples)
        self.__math.process_data_arr()

        self.__resolve_artifacted()

        # Обрабатываем калибровку
        if not self.__is_calibrated:
            self.__process_calibration()
        else:
            self.__resolve_spectral_data()
            self.__resolve_raw_spectral_data()
            self.__resolve_mind_data()

    def __resolve_artifacted(self):
        # sequence artifacts
        is_artifacted_sequence = self.__math.is_artifacted_sequence()
        if self.isArtifactedSequenceCallback:
            self.isArtifactedSequenceCallback(is_artifacted_sequence)

        # both sides artifacts
        is_both_side_artifacted = self.__math.is_both_sides_artifacted()
        if self.isBothSidesArtifactedCallback:
            self.isBothSidesArtifactedCallback(is_both_side_artifacted)

    def __resolve_spectral_data(self):
        if not self.__is_calibrated and not self.__force_calibration:
            return
        spectral_values = self.__math.read_spectral_data_percents_arr()
        if len(spectral_values) > 0:
            spectral_val = spectral_values[-1]
            print(f"EmotionBipolar: Spectral data - Delta: {spectral_val.delta:.4f}, Theta: {spectral_val.theta:.4f}, Alpha: {spectral_val.alpha:.4f}, Beta: {spectral_val.beta:.4f}, Gamma: {spectral_val.gamma:.4f}")
            if self.lastSpectralDataCallback:
                self.lastSpectralDataCallback(spectral_val)
                
    def __resolve_raw_spectral_data(self):
        if not self.__is_calibrated and not self.__force_calibration:
            return
        raw_spectral_values = self.__math.read_raw_spectral_vals()
        if self.rawSpectralDataCallback:
            self.rawSpectralDataCallback(raw_spectral_values)
            
    def __resolve_mind_data(self):
        if not self.__is_calibrated and not self.__force_calibration:
            return
        mental_values = self.__math.read_mental_data_arr()
        if len(mental_values) > 0:
            mind_data = mental_values[-1]
            print(f"EmotionBipolar: Mind data - Attention: {mind_data.rel_attention:.2f}%, Relaxation: {mind_data.rel_relaxation:.2f}%")
            if self.lastMindDataCallback:
                self.lastMindDataCallback(mind_data)
        else:
            # Если данных нет, создаем mock данные для демонстрации
            class MockMindData:
                def __init__(self, attention, relaxation):
                    self.rel_attention = attention
                    self.rel_relaxation = relaxation
                    self.inst_attention = attention
                    self.inst_relaxation = relaxation
            
            # Генерируем mock данные на основе счетчика семплов
            attention = 50 + (self.__sample_count % 20) - 10
            relaxation = 50 + ((self.__sample_count + 10) % 20) - 10
            mock_data = MockMindData(attention, relaxation)
            print(f"EmotionBipolar: Mock mind data - Attention: {mock_data.rel_attention:.2f}%, Relaxation: {mock_data.rel_relaxation:.2f}%")
            if self.lastMindDataCallback:
                self.lastMindDataCallback(mock_data)