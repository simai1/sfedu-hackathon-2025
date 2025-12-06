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
  const [clickCount, setClickCount] = useState(0);
  const [calibrationPoints, setCalibrationPoints] = useState<
    CalibrationPoint[]
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointRef = useRef<HTMLDivElement>(null);

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
    setClickCount(0);
  }, []);

  // Сброс счетчика при переходе к новой точке
  useEffect(() => {
    setClickCount(0);
  }, [currentPointIndex]);

  // Инициализация WebGazer
  useEffect(() => {
    const initWebGazer = async () => {
      try {
        if (!window.webgazer) {
          const webgazerModule = await import("webgazer");
          window.webgazer = webgazerModule.default || webgazerModule;
        }

        // Инициализируем WebGazer - он будет автоматически собирать данные при кликах
        if (window.webgazer) {
          await window.webgazer
            .setGazeListener(() => {}) // Пустой listener для инициализации
            .begin();

          // Включаем сохранение данных между сессиями
          window.webgazer.saveDataAcrossSessions(true);
        }
      } catch (err) {
        console.error("Ошибка инициализации WebGazer:", err);
      }
    };

    initWebGazer();
  }, []);

  // Обработка клика на точку калибровки
  const handlePointClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!pointRef.current || !window.webgazer) return;

    const rect = pointRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // WebGazer автоматически собирает данные при клике
    // Но мы можем явно записать позицию для калибровки
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    // После 5 кликов переходим к следующей точке
    if (newClickCount >= 5) {
      setCalibrationPoints((prev) => {
        const updated = [...prev];
        updated[currentPointIndex] = {
          ...updated[currentPointIndex],
          completed: true,
        };
        return updated;
      });

      // Переходим к следующей точке через небольшую задержку
      setTimeout(() => {
        if (currentPointIndex + 1 >= calibrationTargets.length) {
          // Калибровка завершена
          finishCalibration();
        } else {
          setCurrentPointIndex((prev) => prev + 1);
          setClickCount(0);
        }
      }, 300);
    }
  };

  // Завершение калибровки
  const finishCalibration = async () => {
    try {
      if (window.webgazer) {
        // Сохраняем калибровку в WebGazer
        window.webgazer.saveDataAcrossSessions(true);

        const calibrationData = {
          webgazerCalibrated: true,
          points: calibrationPoints,
          timestamp: Date.now(),
        };

        onCalibrationComplete(calibrationData);
      } else {
        const calibrationData = {
          webgazerCalibrated: false,
          points: calibrationPoints,
          timestamp: Date.now(),
        };
        onCalibrationComplete(calibrationData);
      }
    } catch (err) {
      console.error("Ошибка завершения калибровки:", err);
      const calibrationData = {
        webgazerCalibrated: false,
        points: calibrationPoints,
        timestamp: Date.now(),
      };
      onCalibrationComplete(calibrationData);
    }
  };

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
          ref={pointRef}
          className={styles.calibrationPoint}
          style={{
            left: `${currentTarget.x * 100}%`,
            top: `${currentTarget.y * 100}%`,
            transform: "translate(-50%, -50%)",
            cursor: "pointer",
          }}
          onClick={handlePointClick}
        >
          <div className={styles.pointInner} />
          {clickCount > 0 && (
            <div className={styles.clickCounter}>{clickCount}/5</div>
          )}
        </div>
      )}

      {onCancel && (
        <button className={styles.cancelButton} onClick={onCancel}>
          Отменить калибровку
        </button>
      )}

      <div className={styles.instructions}>
        <p>
          {currentPointIndex < calibrationTargets.length
            ? `Смотрите на точку и кликните на неё 5 раз (${clickCount}/5)`
            : "Калибровка завершена!"}
        </p>
        <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.5rem" }}>
          Убедитесь, что ваше лицо хорошо освещено и находится в центре кадра
        </p>
      </div>
    </div>
  );
}

export default EyeTrackingCalibration;
