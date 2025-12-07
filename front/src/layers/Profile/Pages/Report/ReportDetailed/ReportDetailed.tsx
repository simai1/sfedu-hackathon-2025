import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHistory } from "../../../../../api/files";
import styles from "./ReportDetailed.module.scss";
import { FileUp } from "lucide-react";
import GazeHeatmap, {
  type GazePoint,
} from "../components/GazeHeatmap/GazeHeatmap";

interface HistoryItem {
  id: string;
  user_id: string;
  video_id: string;
  analysis: string;
  created_at: string;
}

interface Screenshot {
  id: string;
  image: string;
  timestamp: number;
  formattedTime: string;
  trigger?: {
    type: string;
    message?: string;
    value?: number;
  };
}

function ReportDetailed() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [gazePoints, setGazePoints] = useState<GazePoint[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) {
        setError("ID отчета не указан");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await getHistory();
        const historyData: HistoryItem[] = response?.data || [];
        const foundReport = historyData.find((item) => item.id === id);

        if (!foundReport) {
          setError("Отчет не найден");
          setIsLoading(false);
          return;
        }

        setReport(foundReport);

        // TODO: Загрузить скриншоты по video_id, если есть API
        // Пока оставляем пустым массивом
        setScreenshots([]);

        // Загружаем данные взгляда из localStorage по video_id
        // Данные сохраняются в Analysis.tsx при просмотре видео
        if (foundReport.video_id) {
          try {
            const storedGazeData = localStorage.getItem(
              `gaze_data_${foundReport.video_id}`
            );
            if (storedGazeData) {
              const parsedData = JSON.parse(storedGazeData);
              if (Array.isArray(parsedData) && parsedData.length > 0) {
                setGazePoints(parsedData);
              }
            }
          } catch (err) {
            console.error("Ошибка при загрузке данных взгляда:", err);
          }
        }
      } catch (err: any) {
        console.error("Ошибка при загрузке отчета:", err);
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Не удалось загрузить отчет"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

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

  const handleExportPdf = () => {
    if (!contentRef.current || !report) return;

    // Конвертируем markdown в HTML для PDF
    const convertMarkdownToHTML = (markdown: string): string => {
      const lines = markdown.split("\n");
      let html = "";
      let inList = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("# ")) {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          html += `<h1>${line.substring(2)}</h1>`;
        } else if (line.startsWith("## ")) {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          html += `<h2>${line.substring(3)}</h2>`;
        } else if (line.startsWith("### ")) {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          html += `<h3>${line.substring(4)}</h3>`;
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          if (!inList) {
            html += "<ul>";
            inList = true;
          }
          const listItem = line
            .substring(2)
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          html += `<li>${listItem}</li>`;
        } else if (line === "") {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          html += "<br/>";
        } else {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          const processed = line
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>");
          html += `<p>${processed}</p>`;
        }
      }

      if (inList) {
        html += "</ul>";
      }

      return html;
    };

    const htmlContent = convertMarkdownToHTML(report.analysis);
    const printWindow = window.open("", "PRINT", "width=900,height=1200");
    if (!printWindow) {
      alert("Не удалось открыть окно для печати. Разрешите всплывающие окна.");
      return;
    }

    // Извлекаем заголовок из анализа
    let title = "Отчет по анализу видео";
    const lines = report.analysis.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("# ")) {
        title = line.trim().substring(2).trim();
        break;
      } else if (line.trim().startsWith("## ")) {
        title = line.trim().substring(3).trim();
        break;
      }
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              padding: 40px; 
              color: #111827; 
              line-height: 1.8;
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            h1 { 
              font-size: 2rem; 
              font-weight: 600; 
              margin: 1.5rem 0 1rem 0;
              color: #1f2937;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 0.5rem;
            }
            h2 { 
              font-size: 1.5rem; 
              font-weight: 600; 
              margin: 1.5rem 0 0.75rem 0;
              color: #374151;
            }
            h3 { 
              font-size: 1.25rem; 
              font-weight: 600; 
              margin: 1.25rem 0 0.5rem 0;
              color: #4b5563;
            }
            p { 
              line-height: 1.8; 
              margin: 1rem 0; 
              color: #374151;
            }
            ul { 
              margin: 1rem 0 1rem 2rem; 
              line-height: 1.8;
            }
            li { 
              margin-bottom: 0.5rem; 
              color: #374151;
            }
            strong {
              font-weight: 600;
              color: #111827;
            }
            em {
              font-style: italic;
              color: #4b5563;
            }
            @media print {
              body { padding: 20px; }
              @page { 
                margin: 1.5cm;
                size: A4;
              }
              h1 { page-break-after: avoid; }
              h2, h3 { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p style="color: #6b7280; margin-bottom: 2rem; font-size: 0.9rem;">
            Дата создания: ${formatDate(report.created_at)}
          </p>
          <div style="margin-top: 2rem;">
            ${htmlContent}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Улучшенный рендеринг markdown (из Analysis.tsx)
  const renderMarkdown = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let currentList: string[] = [];

    // Функция для обработки markdown в тексте
    const processMarkdown = (text: string): string => {
      let processed = text;
      // Жирный текст **text**
      processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Курсив *text* или _text_
      processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>");
      processed = processed.replace(/_(.*?)_/g, "<em>$1</em>");
      // Код `code`
      processed = processed.replace(
        /`(.*?)`/g,
        "<code style='background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;'>$1</code>"
      );
      // Ссылки [text](url)
      processed = processed.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--purple-500); text-decoration: underline;">$1</a>'
      );
      return processed;
    };

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ");
        elements.push(
          <p
            key={`p-${elements.length}`}
            style={{
              marginBottom: "1rem",
              lineHeight: "1.8",
              color: "var(--profile-text)",
            }}
            dangerouslySetInnerHTML={{
              __html: processMarkdown(text),
            }}
          />
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            style={{
              marginLeft: "1.5rem",
              marginBottom: "1rem",
              lineHeight: "1.6",
            }}
          >
            {currentList.map((item, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: "0.5rem",
                  color: "var(--profile-text)",
                }}
                dangerouslySetInnerHTML={{
                  __html: processMarkdown(item),
                }}
              />
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("# ")) {
        flushList();
        flushParagraph();
        const headingText = trimmedLine.substring(2);
        elements.push(
          <h1
            key={`h1-${index}`}
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              marginTop: "1.5rem",
              marginBottom: "1rem",
              color: "var(--profile-text)",
            }}
            dangerouslySetInnerHTML={{
              __html: processMarkdown(headingText),
            }}
          />
        );
      } else if (trimmedLine.startsWith("## ")) {
        flushList();
        flushParagraph();
        const headingText = trimmedLine.substring(3);
        elements.push(
          <h2
            key={`h2-${index}`}
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginTop: "1.25rem",
              marginBottom: "0.75rem",
              color: "var(--profile-text)",
            }}
            dangerouslySetInnerHTML={{
              __html: processMarkdown(headingText),
            }}
          />
        );
      } else if (trimmedLine.startsWith("### ")) {
        flushList();
        flushParagraph();
        const headingText = trimmedLine.substring(4);
        elements.push(
          <h3
            key={`h3-${index}`}
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginTop: "1rem",
              marginBottom: "0.5rem",
              color: "var(--profile-text)",
            }}
            dangerouslySetInnerHTML={{
              __html: processMarkdown(headingText),
            }}
          />
        );
      } else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        flushParagraph();
        currentList.push(trimmedLine.substring(2));
      } else if (trimmedLine === "") {
        flushList();
        flushParagraph();
      } else {
        flushList();
        currentParagraph.push(trimmedLine);
      }
    });

    flushList();
    flushParagraph();

    return elements;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка отчета...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>{error || "Отчет не найден"}</h2>
          <button onClick={() => navigate("/profile/report")}>
            Вернуться к отчетам
          </button>
        </div>
      </div>
    );
  }

  // Извлекаем заголовок из анализа
  let title = "Отчет по анализу видео";
  const lines = report.analysis.split("\n");
  for (const line of lines) {
    if (line.trim().startsWith("# ")) {
      title = line.trim().substring(2).trim();
      break;
    } else if (line.trim().startsWith("## ")) {
      title = line.trim().substring(3).trim();
      break;
    }
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.backButton}
        onClick={() => navigate("/profile/report")}
      >
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
        Назад к отчетам
      </button>

      <div className={styles.header}>
        <div>
          <h1>{title}</h1>
          <p className={styles.date}>{formatDate(report.created_at)}</p>
        </div>
        <div className={styles.meta}>
          <div className={styles.actions}>
            <button className={styles.exportButton} onClick={handleExportPdf}>
              <FileUp size={20} />
              Экспорт в PDF
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content} ref={contentRef}>
        <div className={styles.reportContent}>
          {renderMarkdown(report.analysis)}
        </div>
      </div>

      {/* Тепловая карта взгляда */}
      {gazePoints.length > 0 && <GazeHeatmap gazePoints={gazePoints} />}

      {/* Скриншоты, если есть */}
      {screenshots.length > 0 && (
        <div className={styles.screenshotsSection}>
          <h2>Скриншоты с активностями ({screenshots.length})</h2>
          <div className={styles.screenshotsGrid}>
            {screenshots.map((screenshot) => (
              <div key={screenshot.id} className={styles.screenshotCard}>
                <div className={styles.screenshotImage}>
                  <img
                    src={screenshot.image}
                    alt={`Screenshot at ${screenshot.formattedTime}`}
                  />
                  <div className={styles.screenshotTime}>
                    {screenshot.formattedTime}
                  </div>
                </div>
                {screenshot.trigger && (
                  <div className={styles.screenshotInfo}>
                    <div className={styles.screenshotTrigger}>
                      {screenshot.trigger.type === "concentration_increase" &&
                        "🧠"}
                      {screenshot.trigger.type === "engagement_increase" &&
                        "❤️"}
                      {screenshot.trigger.type === "stress_peak" && "⚠️"}
                      {screenshot.trigger.type === "attention_peak" && "📈"}
                      <span>{screenshot.trigger.message || "Событие"}</span>
                    </div>
                    {screenshot.trigger.value && (
                      <div className={styles.screenshotValue}>
                        Значение: {screenshot.trigger.value}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportDetailed;
