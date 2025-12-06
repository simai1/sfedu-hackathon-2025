import { useState, useEffect, useRef } from "react";

interface GazePoint {
  x: number; // 0-1
  y: number; // 0-1
  valid: boolean;
}

interface UseEyeTrackingOptions {
  videoStream: MediaStream | null;
  calibrationData?: any;
  enabled?: boolean;
  containerRef?: React.RefObject<HTMLElement | null> | React.RefObject<HTMLDivElement | null>;
}

interface UseEyeTrackingReturn {
  gazePoint: GazePoint | null;
  isTracking: boolean;
  error: string | null;
}

// Типы для webgazer
declare global {
  interface Window {
    webgazer: any;
  }
}

export function useEyeTracking({
  videoStream,
  calibrationData,
  enabled = true,
  containerRef,
}: UseEyeTrackingOptions): UseEyeTrackingReturn {
  const [gazePoint, setGazePoint] = useState<GazePoint | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webgazerInitializedRef = useRef(false);
  const gazeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastGazePointRef = useRef<GazePoint | null>(null);
  const gazeHistoryRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    if (!enabled) {
      setIsTracking(false);
      setGazePoint(null);
      if (gazeUpdateIntervalRef.current) {
        clearInterval(gazeUpdateIntervalRef.current);
        gazeUpdateIntervalRef.current = null;
      }
      return;
    }

    const initWebGazer = async () => {
      try {
        // Динамический импорт webgazer
        if (!window.webgazer && !webgazerInitializedRef.current) {
          const webgazerModule = await import("webgazer");
          window.webgazer = webgazerModule.default || webgazerModule;
          webgazerInitializedRef.current = true;
        }

        if (!window.webgazer) {
          setError("Не удалось загрузить библиотеку отслеживания взгляда");
          return;
        }

        // Инициализация webgazer
        // Если webgazer уже был инициализирован (например, во время калибровки), просто продолжаем
        if (!window.webgazer.isReady) {
          await window.webgazer.begin();
        }

        setIsTracking(true);

        // Периодическое обновление для получения координат взгляда
        gazeUpdateIntervalRef.current = setInterval(() => {
          window.webgazer?.getCurrentPrediction().then((prediction: any) => {
            if (prediction && prediction.x !== null && prediction.y !== null) {
              const container = containerRef?.current || document.body;
              const rect = container.getBoundingClientRect();
              
              // Конвертируем абсолютные координаты экрана в относительные (0-1) относительно контейнера
              let x = (prediction.x - rect.left) / rect.width;
              let y = (prediction.y - rect.top) / rect.height;

              // Ограничиваем координаты в пределах [0, 1]
              x = Math.max(0, Math.min(1, x));
              y = Math.max(0, Math.min(1, y));

              // Добавляем в историю для сглаживания
              gazeHistoryRef.current.push({ x, y });
              if (gazeHistoryRef.current.length > 5) {
                gazeHistoryRef.current.shift();
              }

              // Вычисляем среднее значение для сглаживания (простое скользящее среднее)
              const avgX = gazeHistoryRef.current.reduce((sum, p) => sum + p.x, 0) / gazeHistoryRef.current.length;
              const avgY = gazeHistoryRef.current.reduce((sum, p) => sum + p.y, 0) / gazeHistoryRef.current.length;

              // Применяем сглаживание только если есть предыдущая точка
              let finalX = avgX;
              let finalY = avgY;

              if (lastGazePointRef.current) {
                // Экспоненциальное сглаживание для более плавного движения
                const smoothingFactor = 0.3;
                finalX = lastGazePointRef.current.x * (1 - smoothingFactor) + avgX * smoothingFactor;
                finalY = lastGazePointRef.current.y * (1 - smoothingFactor) + avgY * smoothingFactor;
              }

              const newGazePoint: GazePoint = {
                x: finalX,
                y: finalY,
                valid: true,
              };

              lastGazePointRef.current = newGazePoint;
              setGazePoint(newGazePoint);
            }
          }).catch(() => {
            // Игнорируем ошибки получения предсказания
          });
        }, 50);
      } catch (err) {
        setError("Ошибка инициализации отслеживания взгляда");
        setIsTracking(false);
        console.error("Ошибка инициализации webgazer:", err);
      }
    };

    initWebGazer();

    return () => {
      if (gazeUpdateIntervalRef.current) {
        clearInterval(gazeUpdateIntervalRef.current);
        gazeUpdateIntervalRef.current = null;
      }
      if (window.webgazer) {
        window.webgazer.pause();
      }
      setIsTracking(false);
      setGazePoint(null);
      lastGazePointRef.current = null;
      gazeHistoryRef.current = [];
    };
  }, [enabled, videoStream, calibrationData, containerRef]);

  return { gazePoint, isTracking, error };
}

