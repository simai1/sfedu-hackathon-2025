import { useNavigate } from "react-router-dom";
import styles from "./ReportCard.module.scss";

export interface ReportItem {
  id: string;
  title: string;
  date: string;
  preview: string;
  analysis?: string; // Полный текст анализа для просмотра
  video_id?: string;
  type?: "analysis" | "summary" | "detailed";
  status?: "completed" | "draft";
}

interface ReportCardProps {
  item: ReportItem;
}

function ReportCard({ item }: ReportCardProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    // Если клик по кнопке действия, не открываем детальную страницу
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".actionButton")) {
      return;
    }
    navigate(`/profile/report/${item.id}`);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/report/${item.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case "analysis":
        return "Анализ";
      case "summary":
        return "Сводка";
      case "detailed":
        return "Детальный";
      default:
        return "Отчет";
    }
  };

  return (
    <div className={styles.reportCard} onClick={handleClick}>
      <div className={styles.iconContainer}>
        <svg
          width="32"
          height="32"
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
          />
          <path
            d="M14 2V8H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 13H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 17H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 9H9H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{item.title}</h3>
          {item.type && <span className={styles.type}>{getTypeLabel()}</span>}
        </div>
        <p className={styles.date}>{formatDate(item.date)}</p>
        <p className={styles.preview}>{item.preview}</p>
        {item.status && (
          <div className={`${styles.status} ${styles[item.status]}`}>
            {item.status === "completed" ? "Завершен" : "Черновик"}
          </div>
        )}
      </div>
      <div className={styles.actions}>
        {item.analysis && (
          <button
            className={`${styles.actionButton} ${styles.viewButton}`}
            onClick={handleView}
            title="Просмотреть отчет"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        )}
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
    </div>
  );
}

export default ReportCard;
