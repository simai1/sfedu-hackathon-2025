import { useState, useEffect, useRef } from "react";
import styles from "./EyeTrackingCalibration.module.scss";

// Типы для webgazer
declare global {
  interface Window {
    webgazer: any;
  }
}

interface CalibrationPoint {
  x: number;
  y: number;
  completed: boolean;
}

interface EyeTrackingCalibrationProps {
  onCalibrationComplete: (calibrationData: any) => void;
  onCancel?: () => void;
}

function EyeTrackingCalibration({
  onCalibrationComplete,
  onCancel,
}: EyeTrackingCalibrationProps) {
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>(
    []
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const gazeDataRef = useRef<Array<{ x: number; y: number; timestamp: number }>>(
    []
  );

  // Точки калибровки (9 точек в сетке 3x3)
  const calibrationTargets = [
    { x: 0.1, y: 0.1 }, // Верхний левый
    { x: 0.5, y: 0.1 }, // Верхний центр
    { x: 0.9, y: 0.1 }, // Верхний правый
    { x: 0.1, y: 0.5 }, // Средний левый
    { x: 0.5, y: 0.5 }, // Центр
    { x: 0.9, y: 0.5 }, // Средний правый
    { x: 0.1, y: 0.9 }, // Нижний левый
    { x: 0.5, y: 0.9 }, // Нижний центр
    { x: 0.9, y: 0.9 }, // Нижний правый
  ];

  useEffect(() => {
    // Инициализация точек калибровки
    setCalibrationPoints(
      calibrationTargets.map((point) => ({
        ...point,
        completed: false,
      }))
    );
  }, []);

  useEffect(() => {
    if (currentPointIndex >= calibrationTargets.length) {
      // Калибровка завершена
      const calibrationData = {
        points: calibrationPoints,
        gazeSamples: gazeDataRef.current,
        timestamp: Date.now(),
      };
      onCalibrationComplete(calibrationData);
      return;
    }

    // Начинаем сбор данных для текущей точки через 1 секунду после появления
    const timer = setTimeout(() => {
      setIsCollecting(true);
      gazeDataRef.current = [];

      // Собираем данные в течение 2 секунд
      const collectionTimer = setTimeout(() => {
        setIsCollecting(false);
        setCalibrationPoints((prev) => {
          const updated = [...prev];
          updated[currentPointIndex] = {
            ...updated[currentPointIndex],
            completed: true,
          };
          return updated;
        });

        // Переходим к следующей точке через 0.5 секунды
        setTimeout(() => {
          setCurrentPointIndex((prev) => prev + 1);
        }, 500);
      }, 2000);

      return () => clearTimeout(collectionTimer);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentPointIndex, calibrationTargets.length]);

  // Отслеживание взгляда через webgazer
  useEffect(() => {
    if (!isCollecting || !containerRef.current) return;

    const collectGazeData = async () => {
      try {
        // Инициализируем webgazer, если еще не инициализирован
        if (!window.webgazer) {
          const webgazerModule = await import("webgazer");
          window.webgazer = webgazerModule.default || webgazerModule;
        }

        if (!window.webgazer) {
          // Если webgazer недоступен, используем мышь как fallback
          const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            gazeDataRef.current.push({
              x,
              y,
              timestamp: Date.now(),
            });
          };

          window.addEventListener("mousemove", handleMouseMove);
          return () => {
            window.removeEventListener("mousemove", handleMouseMove);
          };
        }

        // Используем webgazer для получения координат взгляда
        const gazeInterval = setInterval(() => {
          window.webgazer?.getCurrentPrediction().then((prediction: any) => {
            if (prediction && prediction.x !== null && prediction.y !== null && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const x = Math.max(0, Math.min(1, (prediction.x - rect.left) / rect.width));
              const y = Math.max(0, Math.min(1, (prediction.y - rect.top) / rect.height));

              gazeDataRef.current.push({
                x,
                y,
                timestamp: Date.now(),
              });
            }
          }).catch(() => {
            // Игнорируем ошибки
          });
        }, 100);

        return () => {
          clearInterval(gazeInterval);
        };
      } catch (err) {
        // Fallback на мышь, если webgazer недоступен
        const handleMouseMove = (e: MouseEvent) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;

          gazeDataRef.current.push({
            x,
            y,
            timestamp: Date.now(),
          });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
          window.removeEventListener("mousemove", handleMouseMove);
        };
      }
    };

    const cleanup = collectGazeData();
    return () => {
      cleanup.then((fn) => fn && fn());
    };
  }, [isCollecting]);

  const currentTarget = calibrationTargets[currentPointIndex];
  const progress = ((currentPointIndex + 1) / calibrationTargets.length) * 100;

  return (
    <div className={styles.calibrationContainer} ref={containerRef}>
      <div className={styles.calibrationHeader}>
        <h2>Калибровка отслеживания взгляда</h2>
        <p>Смотрите на появляющиеся точки на экране</p>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={styles.progressText}>
          Точка {currentPointIndex + 1} из {calibrationTargets.length}
        </p>
      </div>

      {currentPointIndex < calibrationTargets.length && currentTarget && (
        <div
          className={`${styles.calibrationPoint} ${
            isCollecting ? styles.collecting : ""
          }`}
          style={{
            left: `${currentTarget.x * 100}%`,
            top: `${currentTarget.y * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className={styles.pointInner} />
        </div>
      )}

      {onCancel && (
        <button className={styles.cancelButton} onClick={onCancel}>
          Отменить калибровку
        </button>
      )}

      <div className={styles.instructions}>
        <p>
          {isCollecting
            ? "Смотрите на точку..."
            : "Подготовьтесь к следующей точке"}
        </p>
      </div>
    </div>
  );
}

export default EyeTrackingCalibration;

