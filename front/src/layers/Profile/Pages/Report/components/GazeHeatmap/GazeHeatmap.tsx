import { useRef, useEffect } from "react";
import styles from "./GazeHeatmap.module.scss";

export interface GazePoint {
  viewportX: number;
  viewportY: number;
  relativeX: number;
  relativeY: number;
  timestamp: number;
  videoTime: number;
}

interface GazeHeatmapProps {
  gazePoints: GazePoint[];
  width?: number;
  height?: number;
}

function GazeHeatmap({
  gazePoints,
  width = 800,
  height = 450,
}: GazeHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);

    if (gazePoints.length === 0) {
      // Показываем сообщение, если нет данных
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#888";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "Нет данных о взгляде для отображения",
        width / 2,
        height / 2
      );
      return;
    }

    // Фильтруем только валидные точки (relativeX и relativeY от 0 до 1)
    const validPoints = gazePoints.filter(
      (p) =>
        p.relativeX >= 0 &&
        p.relativeX <= 1 &&
        p.relativeY >= 0 &&
        p.relativeY <= 1
    );

    if (validPoints.length === 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#888";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Нет валидных данных о взгляде", width / 2, height / 2);
      return;
    }

    // Создаем карту интенсивности (heatmap)
    const gridSize = 80; // Увеличиваем размер сетки для более плавной карты
    const grid: number[][] = [];
    const radius = 40; // Радиус влияния каждой точки

    // Инициализируем сетку
    for (let i = 0; i < gridSize; i++) {
      grid[i] = [];
      for (let j = 0; j < gridSize; j++) {
        grid[i][j] = 0;
      }
    }

    // Подсчитываем интенсивность в каждой ячейке сетки
    validPoints.forEach((point) => {
      const gridX = point.relativeX * gridSize;
      const gridY = point.relativeY * gridSize;

      // Добавляем вес к ячейке и соседним ячейкам с учетом расстояния
      const influenceRadius = 4;
      for (let dx = -influenceRadius; dx <= influenceRadius; dx++) {
        for (let dy = -influenceRadius; dy <= influenceRadius; dy++) {
          const x = Math.floor(gridX + dx);
          const y = Math.floor(gridY + dy);
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            // Вычисляем расстояние в пикселях canvas
            const pixelDx = (x - gridX) * (width / gridSize);
            const pixelDy = (y - gridY) * (height / gridSize);
            const distance = Math.sqrt(pixelDx * pixelDx + pixelDy * pixelDy);
            // Используем гауссову функцию для более плавного распределения
            const weight = Math.exp(
              -(distance * distance) / (2 * radius * radius)
            );
            grid[y][x] += weight;
          }
        }
      }
    });

    // Находим максимальное значение для нормализации
    let maxValue = 0;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (grid[i][j] > maxValue) {
          maxValue = grid[i][j];
        }
      }
    }

    // Функция для получения цвета по интенсивности
    const getHeatColor = (intensity: number): string => {
      // Нормализуем интенсивность от 0 до 1
      const normalized = maxValue > 0 ? Math.min(intensity / maxValue, 1) : 0;

      // Цветовая палитра от синего (холодный) к красному (горячий)
      if (normalized < 0.25) {
        // Синий -> Голубой
        const t = normalized / 0.25;
        return `rgba(0, ${Math.floor(100 + t * 155)}, ${Math.floor(
          200 + t * 55
        )}, ${0.3 + t * 0.4})`;
      } else if (normalized < 0.5) {
        // Голубой -> Желтый
        const t = (normalized - 0.25) / 0.25;
        return `rgba(${Math.floor(100 + t * 155)}, ${Math.floor(
          255 - t * 100
        )}, 0, ${0.7 + t * 0.2})`;
      } else if (normalized < 0.75) {
        // Желтый -> Оранжевый
        const t = (normalized - 0.5) / 0.25;
        return `rgba(255, ${Math.floor(155 - t * 100)}, 0, ${0.9 + t * 0.1})`;
      } else {
        // Оранжевый -> Красный
        const t = (normalized - 0.75) / 0.25;
        return `rgba(255, ${Math.floor(55 - t * 55)}, 0, 1)`;
      }
    };

    // Рисуем тепловую карту
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (grid[i][j] > 0) {
          const intensity = grid[i][j];
          const color = getHeatColor(intensity);

          // Создаем радиальный градиент для плавного перехода
          const centerX = j * cellWidth + cellWidth / 2;
          const centerY = i * cellHeight + cellHeight / 2;
          const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            Math.max(cellWidth, cellHeight) * 1.5
          );

          gradient.addColorStop(0, color);
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.fillStyle = gradient;
          ctx.fillRect(
            j * cellWidth - cellWidth / 2,
            i * cellHeight - cellHeight / 2,
            cellWidth * 2,
            cellHeight * 2
          );
        }
      }
    }

    // Не рисуем отдельные точки, чтобы не перегружать визуализацию
    // Тепловая карта сама показывает области концентрации взгляда
  }, [gazePoints, width, height]);

  return (
    <div className={styles.heatmapContainer}>
      <h3 className={styles.title}>Тепловая карта взгляда</h3>
      <p className={styles.description}>
        Показывает области видео, на которые вы смотрели чаще всего
      </p>
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={styles.canvas}
        />
        <div className={styles.legend}>
          <span>Редко</span>
          <div className={styles.legendBar}>
            <div className={styles.legendGradient}></div>
          </div>
          <span>Часто</span>
        </div>
      </div>
    </div>
  );
}

export default GazeHeatmap;
