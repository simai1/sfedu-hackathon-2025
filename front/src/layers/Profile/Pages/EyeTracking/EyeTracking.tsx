import { useState, useEffect, useRef } from "react";
import CameraPermission from "../../../../core/components/CameraPermission/CameraPermission";
import EyeTrackingCalibration from "../../../../core/components/EyeTrackingCalibration/EyeTrackingCalibration";
import { useEyeTracking } from "../../../../hooks/useEyeTracking";
import styles from "./EyeTracking.module.scss";

type EyeTrackingState = "cameraPermission" | "calibration" | "tracking";

function EyeTracking() {
  const [state, setState] = useState<EyeTrackingState>("cameraPermission");
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Используем хук для реального отслеживания взгляда
  const { gazePoint, isTracking, error } = useEyeTracking({
    videoStream: cameraStreamRef.current,
    calibrationData: calibrationData,
    enabled: state === "tracking",
    containerRef: containerRef,
  });

  // Конвертируем координаты взгляда в проценты для отображения
  const gazePosition = gazePoint
    ? {
        x: gazePoint.x * 100,
        y: gazePoint.y * 100,
      }
    : null;

  const handleCameraPermissionGranted = (stream: MediaStream) => {
    cameraStreamRef.current = stream;

    // Подключаем поток к видео элементу для отслеживания
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {
        // Тихая ошибка
      });
    }

    setState("calibration");
  };

  const handleCameraPermissionDenied = () => {
    alert("Для отслеживания взгляда необходим доступ к камере");
  };

  const handleCalibrationComplete = (data: any) => {
    setCalibrationData(data);
    setState("tracking");
    // Отслеживание запускается автоматически через хук useEyeTracking
  };

  const handleCalibrationCancel = () => {
    setState("cameraPermission");
  };

  const stopEyeTracking = () => {
    setState("cameraPermission");
    setCalibrationData(null);
  };

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className={styles.eyeTrackingContainer}>
      {state === "cameraPermission" && (
        <CameraPermission
          onPermissionGranted={handleCameraPermissionGranted}
          onPermissionDenied={handleCameraPermissionDenied}
        />
      )}

      {state === "calibration" && (
        <EyeTrackingCalibration
          onCalibrationComplete={handleCalibrationComplete}
          onCancel={handleCalibrationCancel}
        />
      )}

      {state === "tracking" && (
        <div className={styles.trackingArea} ref={containerRef}>
          {/* Скрытое видео с камеры для отслеживания */}
          {cameraStreamRef.current && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                opacity: 0,
                pointerEvents: "none",
                zIndex: -1,
              }}
            />
          )}

          {/* Красный кружок, показывающий направление взгляда */}
          {gazePosition && (
            <div
              className={styles.gazeIndicator}
              style={{
                left: `${gazePosition.x}%`,
                top: `${gazePosition.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {/* Информация о статусе */}
          <div className={styles.statusInfo}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Статус:</span>
              <span className={styles.statusValue}>
                {isTracking ? "Отслеживание активно" : "Ожидание"}
              </span>
            </div>
            {gazePosition && gazePoint?.valid && (
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Координаты:</span>
                <span className={styles.statusValue}>
                  X: {gazePosition.x.toFixed(1)}%, Y:{" "}
                  {gazePosition.y.toFixed(1)}%
                </span>
              </div>
            )}
            {error && (
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Ошибка:</span>
                <span
                  className={styles.statusValue}
                  style={{ color: "#ef4444" }}
                >
                  {error}
                </span>
              </div>
            )}
            {!gazePosition && !error && (
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Информация:</span>
                <span
                  className={styles.statusValue}
                  style={{ color: "#f59e0b" }}
                >
                  Инициализация отслеживания...
                </span>
              </div>
            )}
          </div>

          {/* Кнопка остановки */}
          <button className={styles.stopButton} onClick={stopEyeTracking}>
            Остановить отслеживание
          </button>
        </div>
      )}
    </div>
  );
}

export default EyeTracking;
