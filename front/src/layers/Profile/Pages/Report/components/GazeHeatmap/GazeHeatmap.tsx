import { useRef, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
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
  realtime?: boolean; // Режим обновления в реальном времени
}

// Функция для генерации данных тепловой карты из координат взгляда
function generateHeatmapData(
  gazePoints: GazePoint[],
  gridWidth: number = 200,
  gridHeight: number = 100
): number[][] {
  // Фильтруем только валидные точки (relativeX и relativeY от 0 до 1)
  const validPoints = gazePoints.filter(
    (p) =>
      p.relativeX >= 0 &&
      p.relativeX <= 1 &&
      p.relativeY >= 0 &&
      p.relativeY <= 1
  );

  if (validPoints.length === 0) {
    return [];
  }

  // Создаем сетку для тепловой карты
  const grid: number[][] = [];
  const radius = 20; // Радиус влияния каждой точки

  // Инициализируем сетку
  for (let i = 0; i < gridHeight; i++) {
    grid[i] = [];
    for (let j = 0; j < gridWidth; j++) {
      grid[i][j] = 0;
    }
  }

  // Подсчитываем интенсивность в каждой ячейке сетки
  validPoints.forEach((point) => {
    const gridX = point.relativeX * gridWidth;
    const gridY = point.relativeY * gridHeight;

    // Добавляем вес к ячейке и соседним ячейкам с учетом расстояния
    const influenceRadius = 5;
    for (let dx = -influenceRadius; dx <= influenceRadius; dx++) {
      for (let dy = -influenceRadius; dy <= influenceRadius; dy++) {
        const x = Math.floor(gridX + dx);
        const y = Math.floor(gridY + dy);
        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          // Используем гауссову функцию для более плавного распределения
          const weight = Math.exp(
            -(distance * distance) / (2 * radius * radius)
          );
          grid[y][x] += weight;
        }
      }
    }
  });

  // Преобразуем сетку в формат данных для ECharts [x, y, value]
  const data: number[][] = [];
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      if (grid[i][j] > 0) {
        data.push([j, i, grid[i][j]]);
      }
    }
  }

  return data;
}

function GazeHeatmap({
  gazePoints,
  width = 800,
  height = 450,
  realtime = false,
}: GazeHeatmapProps) {
  const chartRef = useRef<ReactECharts>(null);

  // Генерируем данные для тепловой карты
  const heatmapData = useMemo(() => {
    return generateHeatmapData(gazePoints, 200, 100);
  }, [gazePoints]);

  // Генерируем оси X и Y
  const xData = useMemo(() => {
    return Array.from({ length: 200 }, (_, i) => i);
  }, []);

  const yData = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => i);
  }, []);

  // Находим максимальное значение для нормализации
  const maxValue = useMemo(() => {
    if (heatmapData.length === 0) return 1;
    return Math.max(...heatmapData.map((d) => d[2]));
  }, [heatmapData]);

  // Опции для ECharts
  const option = useMemo(() => {
    return {
      tooltip: {
        position: "top",
        formatter: (params: any) => {
          if (params.data) {
            const [x, y, value] = params.data;
            return `X: ${x}<br/>Y: ${y}<br/>Интенсивность: ${value.toFixed(2)}`;
          }
          return "";
        },
      },
      grid: {
        height: "80%",
        top: "10%",
      },
      xAxis: {
        type: "category",
        data: xData,
        splitArea: {
          show: true,
        },
        show: false, // Скрываем оси для более чистого вида
      },
      yAxis: {
        type: "category",
        data: yData,
        splitArea: {
          show: true,
        },
        show: false, // Скрываем оси для более чистого вида
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        realtime: realtime,
        inRange: {
          color: [
            "#313695",
            "#4575b4",
            "#74add1",
            "#abd9e9",
            "#e0f3f8",
            "#ffffbf",
            "#fee090",
            "#fdae61",
            "#f46d43",
            "#d73027",
            "#a50026",
          ],
        },
        left: "right",
        top: "center",
      },
      series: [
        {
          name: "Тепловая карта взгляда",
          type: "heatmap",
          data: heatmapData,
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          progressive: 1000,
          animation: realtime,
        },
      ],
    };
  }, [heatmapData, xData, yData, maxValue, realtime]);

  // Обновляем график в реальном времени
  useEffect(() => {
    if (realtime && chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      chartInstance.setOption(option, { notMerge: true });
    }
  }, [option, realtime]);

  if (gazePoints.length === 0 || heatmapData.length === 0) {
    return (
      <div className={styles.heatmapContainer}>
        <h3 className={styles.title}>Тепловая карта взгляда</h3>
        <p className={styles.description}>
          Нет данных о взгляде для отображения
        </p>
      </div>
    );
  }

  return (
    <div className={styles.heatmapContainer}>
      <h3 className={styles.title}>Тепловая карта взгляда</h3>
      <p className={styles.description}>
        {realtime
          ? "Обновляется в реальном времени на основе координат взгляда"
          : "Показывает области видео, на которые вы смотрели чаще всего"}
      </p>
      <div className={styles.canvasWrapper}>
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ width: width, height: height }}
          opts={{ renderer: "canvas", devicePixelRatio: 2 }}
        />
      </div>
    </div>
  );
}

export default GazeHeatmap;
