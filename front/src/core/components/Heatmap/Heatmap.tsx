import { useRef, useEffect } from "react";
import styles from "./Heatmap.module.scss";

export interface GazePoint {
  x: number; // Относительные координаты (0-1)
  y: number;
  timestamp: number;
  videoTime?: number; // Время в видео в секундах
}

interface HeatmapProps {
  gazePoints: GazePoint[];
  width: number;
  height: number;
  intensity?: number; // Интенсивность тепловой карты (0-1)
  className?: string;
}

function Heatmap({
  gazePoints,
  width,
  height,
  intensity = 0.6,
  className,
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gazePoints.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);

    // Создаем тепловую карту
    const radius = Math.max(width, height) * 0.1; // Радиус точки взгляда
    const maxIntensity = 255;

    // Создаем карту интенсивности
    const intensityMap: number[][] = [];
    for (let y = 0; y < height; y++) {
      intensityMap[y] = [];
      for (let x = 0; x < width; x++) {
        intensityMap[y][x] = 0;
      }
    }

    // Вычисляем интенсивность для каждой точки
    gazePoints.forEach((point) => {
      const px = point.x * width;
      const py = point.y * height;

      // Добавляем влияние точки на окружающие пиксели
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - px;
          const dy = y - py;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < radius) {
            // Гауссова функция для плавного затухания
            const weight = Math.exp(-(distance * distance) / (2 * (radius / 3) ** 2));
            intensityMap[y][x] += weight;
          }
        }
      }
    });

    // Находим максимальную интенсивность для нормализации
    let maxValue = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (intensityMap[y][x] > maxValue) {
          maxValue = intensityMap[y][x];
        }
      }
    }

    // Рисуем тепловую карту
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const normalizedIntensity =
          maxValue > 0 ? intensityMap[y][x] / maxValue : 0;
        const alpha = normalizedIntensity * intensity;

        // Цветовая схема: от синего (холодный) к красному (горячий)
        let r = 0,
          g = 0,
          b = 0;

        if (normalizedIntensity < 0.25) {
          // Синий -> Голубой
          const t = normalizedIntensity / 0.25;
          r = 0;
          g = Math.floor(t * 255);
          b = 255;
        } else if (normalizedIntensity < 0.5) {
          // Голубой -> Желтый
          const t = (normalizedIntensity - 0.25) / 0.25;
          r = Math.floor(t * 255);
          g = 255;
          b = Math.floor((1 - t) * 255);
        } else if (normalizedIntensity < 0.75) {
          // Желтый -> Оранжевый
          const t = (normalizedIntensity - 0.5) / 0.25;
          r = 255;
          g = Math.floor((1 - t) * 200);
          b = 0;
        } else {
          // Оранжевый -> Красный
          const t = (normalizedIntensity - 0.75) / 0.25;
          r = 255;
          g = Math.floor((1 - t) * 100);
          b = 0;
        }

        data[idx] = r; // Red
        data[idx + 1] = g; // Green
        data[idx + 2] = b; // Blue
        data[idx + 3] = Math.floor(alpha * 255); // Alpha
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [gazePoints, width, height, intensity]);

  return (
    <div
      ref={containerRef}
      className={`${styles.heatmapContainer} ${className || ""}`}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={styles.heatmapCanvas}
      />
      {gazePoints.length === 0 && (
        <div className={styles.noDataMessage}>
          <p>Нет данных о взгляде для отображения</p>
        </div>
      )}
    </div>
  );
}

export default Heatmap;

