import time
import uuid
from dataclasses import dataclass, field


@dataclass
class PendingFrame:
    timecode: str
    relaxation: float
    concentration: float


@dataclass
class EngagementState:
    active: bool = False
    active_audio: bool = False
    last_concentration: float | None = None
    pending_frames: dict[str, PendingFrame] = field(default_factory=dict)
    # Для аудио: отслеживание подъемов и спадов концентрации
    concentration_events: list[dict] = field(default_factory=list)  # Список событий с таймкодами
    current_audio_timecode: float | None = None  # Текущий таймкод аудио


class EngagementTracker:
    """
    Keeps EEG state per user to detect sharp engagement spikes and
    correlate them with uploaded video frames.
    """

    def __init__(self, spike_threshold: float = 0.1):
        self.spike_threshold = spike_threshold
        self.user_states: dict[str, EngagementState] = {}

    def start_video(self, user_id: str):
        if user_id not in self.user_states:
            self.user_states[user_id] = EngagementState()
        self.user_states[user_id].active = True

    def end_video(self, user_id: str):
        state = self.user_states.get(user_id)
        if state:
            state.active = False
            if not state.active_audio:
                self.user_states.pop(user_id, None)

    def start_audio(self, user_id: str):
        if user_id not in self.user_states:
            self.user_states[user_id] = EngagementState()
        self.user_states[user_id].active_audio = True
        self.user_states[user_id].concentration_events = []

    def end_audio(self, user_id: str):
        state = self.user_states.get(user_id)
        if state:
            state.active_audio = False
            if not state.active:
                self.user_states.pop(user_id, None)

    def handle_sample(self, user_id: str, sample: dict, audio_timecode: float | None = None) -> PendingFrame | None:
        state = self.user_states.get(user_id)
        if not state or (not state.active and not state.active_audio):
            return None

        aggregate = self._aggregate(sample)
        if aggregate is None:
            return None
        relaxation, concentration = aggregate

        last = state.last_concentration
        state.last_concentration = concentration

        # Для видео: логика как раньше
        if state.active:
            if last is None:
                return None

            if concentration >= last * (1 + self.spike_threshold):
                tc = str(int(time.time() * 1000))
                frame = PendingFrame(timecode=tc, relaxation=relaxation, concentration=concentration)
                state.pending_frames[tc] = frame
                return frame

        # Для аудио: отслеживание подъемов и спадов концентрации
        if state.active_audio and audio_timecode is not None:
            if last is not None:
                # Определяем подъем или спад концентрации
                threshold = 0.05  # 5% изменение для регистрации события
                concentration_change = concentration - last
                
                if abs(concentration_change) >= threshold:
                    event_type = "increase" if concentration_change > 0 else "decrease"
                    state.concentration_events.append({
                        "timecode": audio_timecode,
                        "concentration": concentration,
                        "relaxation": relaxation,
                        "type": event_type,
                        "change": concentration_change,
                    })

        return None

    def attach_video_frame(
        self,
        user_id: str,
        timecode: str,
        video_id: uuid.UUID,
        screenshot_url: str,
    ) -> tuple[float, float, str, uuid.UUID, str] | None:
        state = self.user_states.get(user_id)
        if not state:
            return None

        frame = state.pending_frames.pop(timecode, None)
        if not frame:
            return None

        return frame.relaxation, frame.concentration, frame.timecode, video_id, screenshot_url

    def _aggregate(self, sample: dict) -> tuple[float, float] | None:
        channels = sample.get("channels") or {}
        if not channels:
            return None

        relax_values: list[float] = []
        concentration_values: list[float] = []
        for channel in channels.values():
            mind = channel.get("mind") or {}
            # Используем relative_attention и relative_relaxation после калибровки (0-1)
            # Умножаем на 100 для получения процентов (0-100)
            rel_relax = mind.get("relative_relaxation") or mind.get("rel_relaxation")
            rel_attention = mind.get("relative_attention") or mind.get("rel_attention")
            instant_relax = mind.get("instant_relaxation", mind.get("inst_relaxation"))
            instant_attention = mind.get("instant_attention", mind.get("inst_attention"))

            if rel_relax is not None:
                # Используем значения после калибровки напрямую (0-1), умножаем на 100 для процентов
                relax_values.append(float(rel_relax) * 100)
            elif instant_relax is not None:
                relax_values.append(float(instant_relax))

            if rel_attention is not None:
                # Используем значения после калибровки напрямую (0-1), умножаем на 100 для процентов
                concentration_values.append(float(rel_attention) * 100)
            elif instant_attention is not None:
                concentration_values.append(float(instant_attention))

        if not concentration_values or not relax_values:
            return None

        relaxation = sum(relax_values) / len(relax_values)
        concentration = sum(concentration_values) / len(concentration_values)
        return relaxation, concentration

    def get_audio_events(self, user_id: str) -> list[dict]:
        """Получить все события концентрации для аудио"""
        state = self.user_states.get(user_id)
        if not state:
            return []
        return state.concentration_events.copy()
