import { useNavigate } from "react-router-dom"
import styles from "./HistoryCard.module.scss"

export interface HistoryItem {
  id: string
  title: string
  date: string
  videoUrl?: string
  thumbnail?: string
  duration?: string
  description?: string
  status?: "completed" | "processing" | "failed"
}

interface HistoryCardProps {
  item: HistoryItem
}

function HistoryCard({ item }: HistoryCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/profile/history/${item.id}`)
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

  const getStatusLabel = () => {
    switch (item.status) {
      case "completed":
        return "Завершен"
      case "processing":
        return "Обработка"
      case "failed":
        return "Ошибка"
      default:
        return ""
    }
  }

  return (
    <div className={styles.historyCard} onClick={handleClick}>
      <div className={styles.thumbnailContainer}>
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className={styles.thumbnail} />
        ) : item.videoUrl ? (
          <video className={styles.thumbnail} src={item.videoUrl} />
        ) : (
          <div className={styles.placeholder}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 5V19L19 12L8 5Z"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          </div>
        )}
        {item.duration && (
          <div className={styles.duration}>{item.duration}</div>
        )}
        {item.status && (
          <div className={`${styles.status} ${styles[item.status]}`}>
            {getStatusLabel()}
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.date}>{formatDate(item.date)}</p>
        {item.description && (
          <p className={styles.description}>{item.description}</p>
        )}
      </div>
      <div className={styles.arrow}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 18L15 12L9 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

export default HistoryCard

