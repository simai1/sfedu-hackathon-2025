import { useEffect } from "react";
import type { VideoPlayerRef } from "../../../../core/components/VideoPlayer/VideoPlayer";

interface VideoAutoPlayHelperProps {
  videoPlayerRef: React.RefObject<VideoPlayerRef | null>;
  isCalibrated: boolean;
}

function VideoAutoPlayHelper({
  videoPlayerRef,
  isCalibrated,
}: VideoAutoPlayHelperProps) {
  useEffect(() => {
    if (!isCalibrated) return;

    const videoElement = videoPlayerRef.current?.getVideoElement();
    if (!videoElement) return;

    // Небольшая задержка, чтобы убедиться, что компонент готов
    const timer = setTimeout(() => {
      if (videoElement.paused) {
        videoElement.play().catch(() => {
          // Тихая ошибка, если автозапуск не удался
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isCalibrated, videoPlayerRef]);

  return null;
}

export default VideoAutoPlayHelper;
