import { useMemo, useState } from "react"
import styles from "./GraphicsHeatmap.module.scss"
import KeyIndicators from "../../modules/graphics/KeyIndicators/KeyIndicators"
import LiveHeatmap from "./components/LiveHeatmap/LiveHeatmap"

type HeatmapType = "engagement" | "attention"

const MODE_META: Record<
  HeatmapType,
  { title: string; description: string; hint: string }
> = {
  engagement: {
    title: "Тепловая карта вовлеченности",
    description: "Подсвечивает зоны, где участники были наиболее вовлечены.",
    hint: "Хорошо подходит для выявления интересных фрагментов видео.",
  },
  attention: {
    title: "Карта концентрации",
    description: "Показывает уровни концентрации по каналам/области кадра.",
    hint: "Для оценки фокуса внимания по времени.",
  },
}

function GraphicsHeatmap() {
  const [mode, setMode] = useState<HeatmapType>("engagement")

  const meta = useMemo(() => MODE_META[mode], [mode])

  return (
    <div className={styles.container}>
      {/* <div className={styles.header}>
        <div>
          <h1>Графики и тепловые карты</h1>
          <p className={styles.subtitle}>
            Ключевые показатели и визуализация алгоритмов (eyetracker / вовлеченность / внимание).
          </p>
        </div>
        <select
          className={styles.selector}
          value={mode}
          onChange={(e) => setMode(e.target.value as HeatmapType)}
        >
          <option value="engagement">Карта вовлеченности</option>
          <option value="attention">Карта концентрации</option>
        </select>
      </div> */}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Ключевые показатели</h2>
          <p className={styles.sectionSubtitle}>Базовые графики из анализа (вовлеченность, внимание и т.д.).</p>
        </div>
        <div className={styles.card}>
          <KeyIndicators />
        </div>
      </div>

      {/* <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>{meta.title}</h2>
          <p className={styles.description}>{meta.description}</p>
          <p className={styles.hint}>{meta.hint}</p>
        </div>

        <LiveHeatmap mode={mode} />
      </div> */}
    </div>
  )
}

export default GraphicsHeatmap

