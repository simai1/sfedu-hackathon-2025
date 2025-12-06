import time
import uuid
from dataclasses import dataclass, field


@dataclass
class PendingFrame:
    timestamp: str
    relaxation: float
    concentration: float


@dataclass
class EngagementState:
    active: bool = False
    last_concentration: float | None = None
    pending_frames: dict[str, PendingFrame] = field(default_factory=dict)


class EngagementTracker:
    """
    Keeps EEG state per user to detect sharp engagement spikes and
    correlate them with uploaded video frames.
    """

    def __init__(self, spike_threshold: float = 0.1):
        self.spike_threshold = spike_threshold
        self.user_states: dict[str, EngagementState] = {}

    def start_video(self, user_id: str):
        self.user_states[user_id] = EngagementState(active=True)

    def end_video(self, user_id: str):
        self.user_states.pop(user_id, None)

    def handle_sample(self, user_id: str, sample: dict) -> PendingFrame | None:
        state = self.user_states.get(user_id)
        if not state or not state.active:
            return None

        aggregate = self._aggregate(sample)
        if aggregate is None:
            return None
        relaxation, concentration = aggregate

        last = state.last_concentration
        state.last_concentration = concentration

        if last is None:
            return None

        if concentration >= last * (1 + self.spike_threshold):
            ts = str(time.time())
            frame = PendingFrame(timestamp=ts, relaxation=relaxation, concentration=concentration)
            state.pending_frames[ts] = frame
            return frame

        return None

    def attach_video_frame(
        self,
        user_id: str,
        timestamp: str,
        video_id: uuid.UUID,
        screenshot_url: str,
    ) -> tuple[float, float, uuid.UUID, str] | None:
        state = self.user_states.get(user_id)
        if not state:
            return None

        frame = state.pending_frames.pop(timestamp, None)
        if not frame:
            return None

        return frame.relaxation, frame.concentration, video_id, screenshot_url

    def _aggregate(self, sample: dict) -> tuple[float, float] | None:
        channels = sample.get("channels") or {}
        if not channels:
            return None

        relax_values: list[float] = []
        concentration_values: list[float] = []
        for channel in channels.values():
            mind = channel.get("mind") or {}
            # Use relative values (0-1), fallback to instant percents (0-100) for older payloads.
            rel_relax = mind.get("rel_relaxation")
            rel_attention = mind.get("rel_attention")
            instant_relax = mind.get("instant_relaxation", mind.get("inst_relaxation"))
            instant_attention = mind.get("instant_attention", mind.get("inst_attention"))

            if rel_relax is not None:
                relax_values.append(float(rel_relax) * 100)
            elif instant_relax is not None:
                relax_values.append(float(instant_relax))

            if rel_attention is not None:
                concentration_values.append(float(rel_attention) * 100)
            elif instant_attention is not None:
                concentration_values.append(float(instant_attention))

        if not concentration_values or not relax_values:
            return None

        relaxation = sum(relax_values) / len(relax_values)
        concentration = sum(concentration_values) / len(concentration_values)
        return relaxation, concentration
