from spectrum_lib.spectrum_lib import SpectrumMath

from neuro_impl.utils import BB_channels


class SpectrumController:
    def __init__(self):
        sampling_rate = 250  # raw signal sampling frequency
        fft_window = sampling_rate * 4  # spectrum calculation window length
        process_win_rate = 5  # spectrum calculation frequency
        bord_frequency = 50  # upper bound of frequencies for spectrum calculation
        normalize_spect_by_bandwidth = True  # normalization of the EEG spectrum by the width of the wavebands
        delta_coef = 0.0
        theta_coef = 1.0
        alpha_coef = 1.0
        beta_coef = 1.0
        gamma_coef = 0.0

        self.maths = {BB_channels[i]: SpectrumMath(sampling_rate, fft_window, process_win_rate) for i in range(4)}
        for i in range(4):
            self.maths[BB_channels[i]].init_params(bord_frequency, normalize_spect_by_bandwidth)
            self.maths[BB_channels[i]].set_waves_coeffs(delta_coef, theta_coef, alpha_coef, beta_coef, gamma_coef)

        self.processedSpectrum = None
        self.processedWaves = None

    def process_data(self, brain_bit_data):
        print(f"SpectrumController: Processing {len(brain_bit_data)} samples")
        o1Values = []
        o2Values = []
        t3Values = []
        t4Values = []
        for i in range(len(brain_bit_data)):
            o1Values.append(brain_bit_data[i].O1 * 1e3)
            o2Values.append(brain_bit_data[i].O2 * 1e3)
            t3Values.append(brain_bit_data[i].T3 * 1e3)
            t4Values.append(brain_bit_data[i].T4 * 1e3)
        self.maths['O1'].push_and_process_data(o1Values)
        self.maths['O2'].push_and_process_data(o2Values)
        self.maths['T3'].push_and_process_data(t3Values)
        self.maths['T4'].push_and_process_data(t4Values)
        self.__resolve_spectrum()
        self.__resolve_waves()
        for i in range(4):
            self.maths[BB_channels[i]].set_new_sample_size()

    def __resolve_spectrum(self):
        for i in range(4):
            raw_spectrum = self.maths[BB_channels[i]].read_raw_spectrum_info_arr()
            raw_data = []
            if len(raw_spectrum) > 0:
                raw_data = raw_spectrum[-1].all_bins_values
            if len(raw_data) > 0:
                print(f"SpectrumController: Spectrum data for {BB_channels[i]}, length: {len(raw_data)}")
                if self.processedSpectrum:
                    self.processedSpectrum(raw_data, BB_channels[i])

    def __resolve_waves(self):
        for i in range(4):
            waves_spectrum = self.maths[BB_channels[i]].read_waves_spectrum_info_arr()
            if len(waves_spectrum) > 0:
                waves_data = waves_spectrum[-1]
                print(f"SpectrumController: Waves data for {BB_channels[i]} - Delta: {waves_data.delta_raw:.4f}, Theta: {waves_data.theta_raw:.4f}, Alpha: {waves_data.alpha_raw:.4f}, Beta: {waves_data.beta_raw:.4f}, Gamma: {waves_data.gamma_raw:.4f}")
                if self.processedWaves:
                    self.processedWaves(waves_data, BB_channels[i])