import { useState, useEffect, useRef } from "react";
import { Camera, AlertCircle, CheckCircle } from "lucide-react";
import styles from "./CameraPermission.module.scss";

interface CameraPermissionProps {
  onPermissionGranted: (stream: MediaStream) => void;
  onPermissionDenied?: () => void;
  onCancel?: () => void;
}

function CameraPermission({
  onPermissionGranted,
  onPermissionDenied,
  onCancel,
}: CameraPermissionProps) {
  const [status, setStatus] = useState<
    "requesting" | "granted" | "denied" | "error"
  >("requesting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    requestCameraAccess();

    // НЕ останавливаем поток при размонтировании, так как он нужен для отслеживания
    // Поток будет остановлен в компоненте Analysis при завершении
    return () => {
      // Оставляем поток активным
    };
  }, []);

  const requestCameraAccess = async () => {
    try {
      setStatus("requesting");
      setErrorMessage(null);

      // Проверяем, поддерживается ли getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Ваш браузер не поддерживает доступ к камере. Пожалуйста, используйте современный браузер."
        );
      }

      // Запрашиваем доступ к камере
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Фронтальная камера
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      // Отображаем видео с камеры
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.error("Ошибка воспроизведения видео:", err);
        });
      }

      setStatus("granted");
      // Вызываем callback через небольшую задержку, чтобы пользователь увидел, что камера работает
      // Передаем поток камеры, чтобы он не остановился
      setTimeout(() => {
        onPermissionGranted(stream);
      }, 1000);
    } catch (error: any) {
      console.error("Ошибка доступа к камере:", error);
      setStatus("denied");

      let errorMsg = "Не удалось получить доступ к камере.";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMsg =
          "Доступ к камере отклонен. Пожалуйста, разрешите доступ к камере в настройках браузера и попробуйте снова.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMsg =
          "Камера не найдена. Убедитесь, что камера подключена и не используется другим приложением.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMsg =
          "Камера уже используется другим приложением. Закройте другие приложения, использующие камеру, и попробуйте снова.";
      } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
        errorMsg =
          "Камера не поддерживает требуемые параметры. Попробуйте использовать другую камеру.";
      } else if (error.message) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);

      if (onPermissionDenied) {
        setTimeout(() => {
          onPermissionDenied();
        }, 3000);
      }
    }
  };

  const handleRetry = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    requestCameraAccess();
  };

  return (
    <div className={styles.cameraPermissionContainer}>
      <div className={styles.cameraPermissionContent}>
        <div className={styles.header}>
          <Camera size={48} className={styles.cameraIcon} />
          <h2>Доступ к камере</h2>
          <p>Для отслеживания взгляда необходим доступ к вашей камере</p>
        </div>

        {status === "requesting" && (
          <div className={styles.statusSection}>
            <div className={styles.loadingSpinner}></div>
            <p>Запрос доступа к камере...</p>
          </div>
        )}

        {status === "granted" && (
          <div className={styles.statusSection}>
            <CheckCircle size={48} className={styles.successIcon} />
            <p className={styles.successText}>
              Доступ к камере получен! Начинаем калибровку...
            </p>
            <div className={styles.videoPreview}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={styles.previewVideo}
              />
            </div>
          </div>
        )}

        {(status === "denied" || status === "error") && (
          <div className={styles.statusSection}>
            <AlertCircle size={48} className={styles.errorIcon} />
            <p className={styles.errorText}>
              {errorMessage || "Не удалось получить доступ к камере"}
            </p>
            <div className={styles.actions}>
              <button className={styles.retryButton} onClick={handleRetry}>
                Попробовать снова
              </button>
              {onCancel && (
                <button className={styles.cancelButton} onClick={onCancel}>
                  Отменить
                </button>
              )}
            </div>
          </div>
        )}

        {status === "requesting" && (
          <div className={styles.instructions}>
            <p>
              <strong>Инструкция:</strong>
            </p>
            <ul>
              <li>Нажмите "Разрешить" в запросе браузера</li>
              <li>Убедитесь, что камера не используется другим приложением</li>
              <li>Расположитесь так, чтобы ваше лицо было хорошо видно</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default CameraPermission;

