import { useEffect, useRef } from "react";
import type { ReportItem } from "../ReportCard/ReportCard";
import styles from "./ReportModal.module.scss";

interface ReportModalProps {
  report: ReportItem;
  onClose: () => void;
}

function ReportModal({ report, onClose }: ReportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Функция для рендеринга markdown в HTML
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

  const handleDownload = () => {
    if (!report.analysis) return;

    // Конвертируем markdown в HTML для PDF (та же логика что в ReportCard)
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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.title}</title>
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
          <h1>${report.title}</h1>
          <p style="color: #6b7280; margin-bottom: 2rem; font-size: 0.9rem;">
            Дата создания: ${formatDate(report.date)}
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

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <div>
            <h2>{report.title}</h2>
            <p className={styles.date}>{formatDate(report.date)}</p>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.downloadButton}
              onClick={handleDownload}
              title="Скачать PDF"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 10L12 15L17 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15V3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Скачать PDF
            </button>
            <button
              className={styles.closeButton}
              onClick={onClose}
              title="Закрыть"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className={styles.content} ref={contentRef}>
          {report.analysis && (
            <div className={styles.reportContent}>
              {renderMarkdown(report.analysis)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
