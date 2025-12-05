import { useState } from "react"
import HistoryCard, { type HistoryItem } from "./components/HistoryCard/HistoryCard"
import styles from "./History.module.scss"

// Моковые данные для примера
const mockHistoryItems: HistoryItem[] = [
  {
    id: "1",
    title: "Анализ видео: Презентация проекта",
    date: "2024-12-05T14:30:00",
    duration: "15:32",
    description: "Полный анализ эмоционального состояния во время презентации",
    status: "completed",
    thumbnail: "https://via.placeholder.com/200x120",
  },
  {
    id: "2",
    title: "Анализ видео: Встреча с командой",
    date: "2024-12-04T10:15:00",
    duration: "42:18",
    description: "Оценка вовлеченности и внимательности участников",
    status: "completed",
  },
  {
    id: "3",
    title: "Анализ видео: Онлайн обучение",
    date: "2024-12-03T16:45:00",
    duration: "28:05",
    description: "Мониторинг концентрации внимания во время обучения",
    status: "processing",
  },
  {
    id: "4",
    title: "Анализ видео: Интервью",
    date: "2024-12-02T09:20:00",
    duration: "35:12",
    description: "Анализ эмоциональных реакций кандидата",
    status: "completed",
  },
]

function History() {
  const [historyItems] = useState<HistoryItem[]>(mockHistoryItems)

  return (
    <div className={styles.historyContainer}>
      <div className={styles.header}>
        <h1>История анализов</h1>
        <p className={styles.subtitle}>
          Все ваши проведенные анализы видео и отчеты
        </p>
      </div>

      {historyItems.length === 0 ? (
        <div className={styles.emptyState}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 5V19L19 12L8 5Z"
              fill="currentColor"
              opacity="0.3"
            />
          </svg>
          <p>История анализов пуста</p>
          <span>Начните анализ видео, чтобы увидеть результаты здесь</span>
        </div>
      ) : (
        <div className={styles.historyList}>
          {historyItems.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

export default History
