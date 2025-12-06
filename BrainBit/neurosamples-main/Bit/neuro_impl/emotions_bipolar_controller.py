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
        self.calibration_length = 10
        nwins_skip_after_artifact = 10

        self.__math = EmotionalMath(mls, ads, mss)
        self.__math.set_calibration_length(self.calibration_length)
        self.__math.set_mental_estimation_mode(False)
        self.__math.set_skip_wins_after_artifact(nwins_skip_after_artifact)
        # Для расчетов ментальных уровней (концентрация и расслабленность) 
        # SDK рекомендует обнулять дельту и гамму, используя только тета, альфа и бета
        # Параметры: (active, delta, theta, alpha, beta, gamma)
        self.__math.set_zero_spect_waves(True, 0, 1, 1, 1, 0)
        self.__math.set_spect_normalization_by_bands_width(True)

        self.__is_calibrated = False
        self.__is_running = False  # Флаг для отслеживания состояния работы
        self.isArtifactedSequenceCallback = None
        self.isBothSidesArtifactedCallback = None
        self.progressCalibrationCallback = None
        self.lastSpectralDataCallback = None
        self.rawSpectralDataCallback = None
        self.lastMindDataCallback = None
        
    def get_calibration_data(self) -> dict:
        """Получение всех данных после калибровки"""
        data = {
            "calibration_completed": self.__is_calibrated,
            "channels": {}
        }
        
        if not self.__is_calibrated:
            return data
        
        # Для биполярной калибровки у нас есть два канала: left (T3-O1) и right (T4-O2)
        # Преобразуем их в формат каналов O1, O2, T3, T4 для совместимости
        
        # Спектральные данные
        spectral_values = self.__math.read_spectral_data_percents_arr()
        if len(spectral_values) > 0:
            spectral = spectral_values[-1]
            spectral_data = {
                "delta": float(spectral.delta),
                "theta": float(spectral.theta),
                "alpha": float(spectral.alpha),
                "beta": float(spectral.beta),
                "gamma": float(spectral.gamma)
            }
            # Применяем к каналам, связанным с биполярными измерениями
            # Left bipolar (T3-O1) влияет на T3 и O1
            # Right bipolar (T4-O2) влияет на T4 и O2
            for channel in ['O1', 'O2', 'T3', 'T4']:
                if channel not in data["channels"]:
                    data["channels"][channel] = {}
                data["channels"][channel]["spectral"] = spectral_data
        
        # Сырые спектральные данные
        raw_spectral = self.__math.read_raw_spectral_vals()
        if raw_spectral:
            raw_spectral_data = {
                "alpha": float(raw_spectral.alpha),
                "beta": float(raw_spectral.beta)
            }
            for channel in ['O1', 'O2', 'T3', 'T4']:
                if channel not in data["channels"]:
                    data["channels"][channel] = {}
                data["channels"][channel]["raw_spectral"] = raw_spectral_data
        
        # Ментальные данные
        mental_values = self.__math.read_mental_data_arr()
        if len(mental_values) > 0:
            mind = mental_values[-1]
            mind_data = {
                "rel_attention": float(mind.rel_attention),
                "rel_relaxation": float(mind.rel_relaxation),
                "inst_attention": float(mind.inst_attention),
                "inst_relaxation": float(mind.inst_relaxation)
            }
            for channel in ['O1', 'O2', 'T3', 'T4']:
                if channel not in data["channels"]:
                    data["channels"][channel] = {}
                data["channels"][channel]["mind"] = mind_data
        
        return data

    def start_calibration(self):
        self.__math.start_calibration()
        self.__is_running = True
        
    def stop_calibration(self):
        """Остановка калибровки"""
        self.__is_running = False
        self.__is_calibrated = False
        
    def __process_calibration(self):
        if not self.__is_running:
            return
        
        # Проверяем, завершена ли калибровка по данным библиотеки
        self.__is_calibrated = self.__math.calibration_finished()
        
        # Получаем прогресс из библиотеки
        progress = self.__math.get_calibration_percents()
        
        # Отображаем прогресс калибровки
        if self.progressCalibrationCallback:
            self.progressCalibrationCallback(progress)
        
        # Если калибровка завершена библиотекой, устанавливаем прогресс в 100%
        if self.__is_calibrated:
            if self.progressCalibrationCallback:
                self.progressCalibrationCallback(100)

    def process_data(self, brain_bit_data: []):
        # Проверяем, запущена ли калибровка
        if not self.__is_running:
            return
            
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
        # Используем данные только если калибровка действительно завершена библиотекой
        if not self.__is_calibrated:
            return
        spectral_values = self.__math.read_spectral_data_percents_arr()
        if len(spectral_values) > 0:
            spectral_val = spectral_values[-1]
            if self.lastSpectralDataCallback:
                self.lastSpectralDataCallback(spectral_val)
                
    def __resolve_raw_spectral_data(self):
        # Используем данные только если калибровка действительно завершена библиотекой
        if not self.__is_calibrated:
            return
        raw_spectral_values = self.__math.read_raw_spectral_vals()
        if self.rawSpectralDataCallback:
            self.rawSpectralDataCallback(raw_spectral_values)
            
    def __resolve_mind_data(self):
        # Используем данные только если калибровка действительно завершена библиотекой
        if not self.__is_calibrated:
            return
        
        mental_values = self.__math.read_mental_data_arr()
        if len(mental_values) > 0:
            mind_data = mental_values[-1]
            if self.lastMindDataCallback:
                self.lastMindDataCallback(mind_data)