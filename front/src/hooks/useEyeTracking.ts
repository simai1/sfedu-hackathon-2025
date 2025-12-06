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
        await window.webgazer
          .setGazeListener((data: any) => {
            if (data && data.x !== null && data.y !== null) {
              // Получаем координаты относительно контейнера
              const container = containerRef?.current || document.body;
              const rect = container.getBoundingClientRect();
              
              // Конвертируем абсолютные координаты в относительные (0-1)
              const x = Math.max(0, Math.min(1, (data.x - rect.left) / rect.width));
              const y = Math.max(0, Math.min(1, (data.y - rect.top) / rect.height));

              setGazePoint({
                x,
                y,
                valid: true,
              });
            }
          })
          .begin();

        setIsTracking(true);

        // Если есть данные калибровки, применяем их
        if (calibrationData) {
          // WebGazer использует калибровку автоматически, если она была выполнена
          // Можно применить дополнительные настройки здесь
        }

        // Периодическое обновление для получения координат взгляда
        gazeUpdateIntervalRef.current = setInterval(() => {
          window.webgazer?.getCurrentPrediction().then((prediction: any) => {
            if (prediction && prediction.x !== null && prediction.y !== null) {
              const container = containerRef?.current || document.body;
              const rect = container.getBoundingClientRect();
              
              const x = Math.max(0, Math.min(1, (prediction.x - rect.left) / rect.width));
              const y = Math.max(0, Math.min(1, (prediction.y - rect.top) / rect.height));

              setGazePoint({
                x,
                y,
                valid: true,
              });
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
    };
  }, [enabled, videoStream, calibrationData, containerRef]);

  return { gazePoint, isTracking, error };
}

