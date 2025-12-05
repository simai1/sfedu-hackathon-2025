import { useState } from "react"
import ReportCard, { type ReportItem } from "./components/ReportCard/ReportCard"
import styles from "./Report.module.scss"

// Моковые данные для примера
const mockReportItems: ReportItem[] = [
  {
    id: "1",
    title: "Отчет по анализу презентации проекта",
    date: "2024-12-05T14:30:00",
    preview:
      "Проведен полный анализ эмоционального состояния во время презентации проекта. Выявлен высокий уровень концентрации внимания (85%) и умеренный уровень стресса (35%). Рекомендуется делать небольшие паузы для восстановления.",
    type: "detailed",
    status: "completed",
  },
  {
    id: "2",
    title: "Сводный отчет: Встреча с командой",
    date: "2024-12-04T10:15:00",
    preview:
      "Анализ вовлеченности участников команды показал положительные результаты. Средний уровень внимания составил 78%, что указывает на высокую заинтересованность в обсуждении.",
    type: "summary",
    status: "completed",
  },
  {
    id: "3",
    title: "Детальный анализ онлайн обучения",
    date: "2024-12-03T16:45:00",
    preview:
      "Мониторинг концентрации внимания во время онлайн обучения выявил несколько периодов снижения фокуса. Рекомендуется использовать интерактивные элементы для поддержания вовлеченности.",
    type: "analysis",
    status: "completed",
  },
  {
    id: "4",
    title: "Отчет по интервью кандидата",
    date: "2024-12-02T09:20:00",
    preview:
      "Анализ эмоциональных реакций кандидата во время интервью показал стабильное эмоциональное состояние. Уровень уверенности оставался высоким на протяжении всей беседы.",
    type: "detailed",
    status: "draft",
  },
]

function Report() {
  const [reportItems] = useState<ReportItem[]>(mockReportItems)

  return (
    <div className={styles.reportContainer}>
      <div className={styles.header}>
        <h1>Отчеты</h1>
        <p className={styles.subtitle}>
          Все сгенерированные отчеты по проведенным анализам
        </p>
      </div>

      {reportItems.length === 0 ? (
        <div className={styles.emptyState}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
            />
          </svg>
          <p>Отчеты отсутствуют</p>
          <span>Сгенерируйте отчет, чтобы увидеть его здесь</span>
        </div>
      ) : (
        <div className={styles.reportList}>
          {reportItems.map((item) => (
            <ReportCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Report
