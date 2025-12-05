from em_st_artifacts.emotional_math import EmotionalMath
from em_st_artifacts.utils.lib_settings import MathLibSetting, ArtifactDetectSetting, \
    MentalAndSpectralSetting
from em_st_artifacts.utils.support_classes import RawChannelsArray

BB_channels = ['O1', 'O2', 'T3', 'T4']


class EmotionMonopolar:
    def __init__(self):
        mls = MathLibSetting(sampling_rate=250,
                             process_win_freq=25,
                             n_first_sec_skipped=4,
                             fft_window=1000,
                             bipolar_mode=False,
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

        self.__maths = {BB_channels[i]: EmotionalMath(mls, ads, mss) for i in range(4)}
        for i in range(4):
            self.__maths[BB_channels[i]].set_calibration_length(calibration_length)
            self.__maths[BB_channels[i]].set_mental_estimation_mode(False)
            self.__maths[BB_channels[i]].set_skip_wins_after_artifact(nwins_skip_after_artifact)
            self.__maths[BB_channels[i]].set_zero_spect_waves(True, 0, 1, 1, 1, 0)
            self.__maths[BB_channels[i]].set_spect_normalization_by_bands_width(True)

        self.__is_calibrated = {'O1': False, 'O2': False, 'T3': False, 'T4': False}
        self.__is_running = False  # Флаг для отслеживания состояния работы
        self.isArtifactedSequenceCallback = None
        self.isBothSidesArtifactedCallback = None
        self.progressCalibrationCallback = None
        self.lastSpectralDataCallback = None
        self.rawSpectralDataCallback = None
        self.lastMindDataCallback = None

    def start_calibration(self):
        print("EmotionMonopolar: Starting calibration")
        for i in range(4):
            self.__maths[BB_channels[i]].start_calibration()
        self.__is_running = True
            
    def stop_calibration(self):
        """Остановка калибровки"""
        print("EmotionMonopolar: Stopping calibration")
        self.__is_running = False
        # Сбрасываем состояние калибровки для всех каналов
        for channel in BB_channels:
            self.__is_calibrated[channel] = False
            
    def __process_calibration(self):
        if not self.__is_running:
            return
            
        for i in range(4):
            if self.__is_calibrated[BB_channels[i]]:
                continue
            self.__is_calibrated[BB_channels[i]] = self.__maths[BB_channels[i]].calibration_finished()
            
            if not self.__is_calibrated[BB_channels[i]]:
                progress = self.__maths[BB_channels[i]].get_calibration_percents()
                print(f"EmotionMonopolar: Calibration progress for {BB_channels[i]}: {progress}%")
                if self.progressCalibrationCallback:
                    self.progressCalibrationCallback(progress, BB_channels[i])
            else:
                print(f"EmotionMonopolar: Calibration finished for {BB_channels[i]}")

    def process_data(self, brain_bit_data: []):
        # Проверяем, запущена ли калибровка
        if not self.__is_running:
            return
            
        print(f"EmotionMonopolar: Processing {len(brain_bit_data)} samples")
        o1Values = []
        o2Values = []
        t3Values = []
        t4Values = []
        for i in range(len(brain_bit_data)):
            o1Values.append(RawChannelsArray([brain_bit_data[i].O1]))
            o2Values.append(RawChannelsArray([brain_bit_data[i].O2]))
            t3Values.append(RawChannelsArray([brain_bit_data[i].T3]))
            t4Values.append(RawChannelsArray([brain_bit_data[i].T4]))
        try:
            self.__maths['O1'].push_monopolars(o1Values)
            self.__maths['O2'].push_monopolars(o2Values)
            self.__maths['T3'].push_monopolars(t3Values)
            self.__maths['T4'].push_monopolars(t4Values)
        except Exception as e:
            print(f"Error pushing monopolars: {e}")
            return

        try:
            self.__maths['O1'].process_data_arr()
            self.__maths['O2'].process_data_arr()
            self.__maths['T3'].process_data_arr()
            self.__maths['T4'].process_data_arr()
        except Exception as e:
            print(f"Error processing data: {e}")
            return

        # Обрабатываем калибровку
        self.__process_calibration()

        for i in range(4):
            channel = BB_channels[i]
            if self.__is_calibrated[channel]:
                # spectral data
                spectral_values = self.__maths[channel].read_spectral_data_percents_arr()
                if len(spectral_values) > 0:
                    spectral_val = spectral_values[-1]
                    print(
                        f"EmotionMonopolar: Spectral data for {channel} - Delta: {spectral_val.delta * 100:.2f}%, Theta: {spectral_val.theta * 100:.2f}%, Alpha: {spectral_val.alpha * 100:.2f}%, Beta: {spectral_val.beta * 100:.2f}%, Gamma: {spectral_val.gamma * 100:.2f}%")
                    if self.lastSpectralDataCallback:
                        self.lastSpectralDataCallback(spectral_val, channel)

                # raw spectral data
                raw_spectral_values = self.__maths[channel].read_raw_spectral_vals()
                if self.rawSpectralDataCallback:
                    self.rawSpectralDataCallback(raw_spectral_values, channel)

                # mental data
                mental_values = self.__maths[channel].read_mental_data_arr()
                if len(mental_values) > 0:
                    mind_data = mental_values[-1]
                    print(
                        f"EmotionMonopolar: Mind data for {channel} - Attention: {mind_data.rel_attention:.2f}%, Relaxation: {mind_data.rel_relaxation:.2f}%")
                    if self.lastMindDataCallback:
                        self.lastMindDataCallback(mind_data, channel)