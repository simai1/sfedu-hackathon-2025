import { useParams, useNavigate } from "react-router-dom"
import ReactPlayer from "react-player"
import styles from "./HistoryDetailed.module.scss"

const mockDetailedData: Record<string, any> = {
  "1": {
    id: "1",
    title: "Анализ видео: Презентация проекта",
    date: "2024-12-05T14:30:00",
    duration: "15:32",
    videoUrl: "https://example.com/video1.mp4",
    description:
      "Полный анализ эмоционального состояния во время презентации проекта. Оценка уровня стресса, концентрации внимания и вовлеченности.",
    status: "completed",
    metrics: {
      averageAttention: 85,
      averageRelaxation: 72,
      stressLevel: 35,
      engagement: 88,
    },
    emotions: [
      { time: "00:00", emotion: "Спокойствие", value: 75 },
      { time: "05:00", emotion: "Концентрация", value: 90 },
      { time: "10:00", emotion: "Уверенность", value: 82 },
      { time: "15:00", emotion: "Удовлетворение", value: 88 },
    ],
    recommendations: [
      "Высокий уровень концентрации на протяжении всей презентации",
      "Рекомендуется делать небольшие паузы каждые 10-15 минут",
      "Эмоциональное состояние стабильное и позитивное",
    ],
  },
}

function HistoryDetailed() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const data = id ? mockDetailedData[id] : null

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Отчет не найден</h2>
          <button onClick={() => navigate("/profile/history")}>
            Вернуться к истории
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate("/profile/history")}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Назад к истории
      </button>

      <div className={styles.header}>
        <div>
          <h1>{data.title}</h1>
          <p className={styles.date}>{formatDate(data.date)}</p>
        </div>
        <div className={styles.meta}>
          <span className={styles.duration}>Длительность: {data.duration}</span>
          <span className={`${styles.status} ${styles[data.status]}`}>
            {data.status === "completed" ? "Завершен" : "Обработка"}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.videoSection}>
          <h2>Видео</h2>
          <div className={styles.videoContainer}>
            {data.videoUrl ? (
              <ReactPlayer
                url={data.videoUrl}
                controls
                width="100%"
                height="100%"
              />
            ) : (
              <div className={styles.videoPlaceholder}>
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
                <p>Видео недоступно</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.description}>
            <h2>Описание</h2>
            <p>{data.description}</p>
          </div>

          {data.metrics && (
            <div className={styles.metrics}>
              <h2>Метрики</h2>
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Внимание</span>
                  <span className={styles.metricValue}>
                    {data.metrics.averageAttention}%
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Расслабление</span>
                  <span className={styles.metricValue}>
                    {data.metrics.averageRelaxation}%
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Уровень стресса</span>
                  <span className={styles.metricValue}>
                    {data.metrics.stressLevel}%
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Вовлеченность</span>
                  <span className={styles.metricValue}>
                    {data.metrics.engagement}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {data.emotions && data.emotions.length > 0 && (
            <div className={styles.emotions}>
              <h2>Эмоциональные состояния</h2>
              <div className={styles.emotionsList}>
                {data.emotions.map((emotion: any, index: number) => (
                  <div key={index} className={styles.emotionItem}>
                    <span className={styles.emotionTime}>{emotion.time}</span>
                    <span className={styles.emotionName}>{emotion.emotion}</span>
                    <div className={styles.emotionBar}>
                      <div
                        className={styles.emotionBarFill}
                        style={{ width: `${emotion.value}%` }}
                      />
                    </div>
                    <span className={styles.emotionValue}>{emotion.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.recommendations && data.recommendations.length > 0 && (
            <div className={styles.recommendations}>
              <h2>Рекомендации</h2>
              <ul>
                {data.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistoryDetailed

