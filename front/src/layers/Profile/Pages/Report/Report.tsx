import { useState, useEffect } from "react";
import ReportCard, {
  type ReportItem,
} from "./components/ReportCard/ReportCard";
import { getHistory } from "../../../../api/files";
import styles from "./Report.module.scss";

// Интерфейс для ответа API
interface HistoryItem {
  id: string;
  user_id: string;
  video_id: string;
  analysis: string;
  created_at: string;
}

function Report() {
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getHistory();
        const historyData: HistoryItem[] = response?.data || [];

        // Преобразуем данные API в формат ReportItem
        const reports: ReportItem[] = historyData.map((item) => {
          // Извлекаем превью из анализа (первые 150 символов)
          const preview = item.analysis
            .replace(/#{1,6}\s+/g, "") // Убираем заголовки
            .replace(/\*\*(.*?)\*\*/g, "$1") // Убираем жирный текст
            .replace(/\n+/g, " ") // Заменяем переносы строк на пробелы
            .trim()
            .substring(0, 150);

          // Извлекаем заголовок из анализа (первая строка с заголовком или первые 50 символов)
          let title = "Отчет по анализу видео";
          const lines = item.analysis.split("\n");
          for (const line of lines) {
            if (line.trim().startsWith("# ")) {
              title = line.trim().substring(2).trim();
              break;
            } else if (line.trim().startsWith("## ")) {
              title = line.trim().substring(3).trim();
              break;
            }
          }
          if (title.length > 50) {
            title = title.substring(0, 50) + "...";
          }

          return {
            id: item.id,
            title: title || "Отчет по анализу видео",
            date: item.created_at,
            preview: preview + (item.analysis.length > 150 ? "..." : ""),
            analysis: item.analysis, // Сохраняем полный анализ для просмотра
            video_id: item.video_id,
            type: "detailed" as const,
            status: "completed" as const,
          };
        });

        setReportItems(reports);
      } catch (err: any) {
        console.error("Ошибка при загрузке истории отчетов:", err);
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Не удалось загрузить отчеты. Попробуйте обновить страницу."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className={styles.reportContainer}>
      <div className={styles.header}>
        <h1>Отчеты</h1>
        <p className={styles.subtitle}>
          Все сгенерированные отчеты по проведенным анализам
        </p>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
          </div>
          <p>Загрузка отчетов...</p>
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
            />
          </svg>
          <p>Ошибка загрузки</p>
          <span>{error}</span>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.5rem",
              background: "var(--purple-500)",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.9375rem",
            }}
          >
            Обновить
          </button>
        </div>
      ) : reportItems.length === 0 ? (
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
  );
}

export default Report;
