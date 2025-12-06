import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import styles from "./ReportDetailed.module.scss"

const mockDetailedReports: Record<string, any> = {
  "1": {
    id: "1",
    title: "Отчет по анализу презентации проекта",
    date: "2024-12-05T14:30:00",
    type: "detailed",
    status: "completed",
    content: `
# Отчет по анализу презентации проекта

## Общая информация
Дата проведения анализа: 5 декабря 2024, 14:30
Длительность анализа: 15 минут 32 секунды
Тип анализа: Детальный анализ эмоционального состояния

## Основные метрики

### Уровень внимания
Средний уровень концентрации внимания составил **85%**, что является отличным показателем. На протяжении всей презентации наблюдалась стабильная фокусировка на материале.

### Уровень расслабления
Средний показатель расслабления - **72%**. Это указывает на комфортное эмоциональное состояние без излишнего напряжения.

### Уровень стресса
Уровень стресса составил **35%**, что находится в пределах нормы. Небольшое повышение стресса наблюдалось в начале презентации, что является естественной реакцией.

### Расслабленность
Общий уровень вовлеченности - **88%**, что демонстрирует высокую заинтересованность в представленном материале.

## Эмоциональные состояния по времени

- **00:00 - 05:00**: Начальная стадия - легкое волнение, быстро переходящее в концентрацию
- **05:00 - 10:00**: Период максимальной концентрации и уверенности
- **10:00 - 15:00**: Стабильное состояние с высоким уровнем вовлеченности
- **15:00 - 15:32**: Завершающая стадия - удовлетворение и уверенность

## Выводы и рекомендации

### Положительные аспекты:
1. Высокий уровень концентрации на протяжении всей презентации
2. Стабильное эмоциональное состояние без резких перепадов
3. Отличная Расслабленность в процесс

### Рекомендации:
1. Рекомендуется делать небольшие паузы каждые 10-15 минут для восстановления
2. В начале презентации можно использовать техники релаксации для снижения начального волнения
3. Эмоциональное состояние стабильное и позитивное - поддерживать текущий подход

## Заключение

Презентация прошла успешно с точки зрения эмоционального состояния. Все показатели находятся в оптимальных пределах, что способствует эффективной коммуникации и восприятию информации.
    `.trim(),
  },
  "2": {
    id: "2",
    title: "Сводный отчет: Встреча с командой",
    date: "2024-12-04T10:15:00",
    type: "summary",
    status: "completed",
    content: `
# Сводный отчет: Встреча с командой

## Краткая информация
Дата: 4 декабря 2024, 10:15
Длительность встречи: 42 минуты 18 секунд

## Основные показатели

Средний уровень внимания участников: **78%**
Уровень вовлеченности: **82%**
Эмоциональный фон: Позитивный

## Выводы

Анализ вовлеченности участников команды показал положительные результаты. Средний уровень внимания составил 78%, что указывает на высокую заинтересованность в обсуждении. Участники демонстрировали активное участие и заинтересованность в решаемых вопросах.
    `.trim(),
  },
  "3": {
    id: "3",
    title: "Детальный анализ онлайн обучения",
    date: "2024-12-03T16:45:00",
    type: "analysis",
    status: "completed",
    content: `
# Детальный анализ онлайн обучения

## Обзор

Мониторинг концентрации внимания во время онлайн обучения выявил несколько периодов снижения фокуса. Общая динамика показывает необходимость использования интерактивных элементов для поддержания вовлеченности.

## Детальный анализ

### Периоды высокой концентрации
- 0-10 минут: 90% внимания
- 20-30 минут: 85% внимания

### Периоды снижения внимания
- 10-20 минут: 65% внимания
- 30-40 минут: 70% внимания

## Рекомендации

Рекомендуется использовать интерактивные элементы для поддержания вовлеченности в периоды снижения концентрации.
    `.trim(),
  },
  "4": {
    id: "4",
    title: "Отчет по интервью кандидата",
    date: "2024-12-02T09:20:00",
    type: "detailed",
    status: "draft",
    content: `
# Отчет по интервью кандидата

## Предварительные результаты

Анализ эмоциональных реакций кандидата во время интервью показал стабильное эмоциональное состояние. Уровень уверенности оставался высоким на протяжении всей беседы.

*Этот отчет находится в стадии черновика и может быть дополнен.*
    `.trim(),
  },
}

function ReportDetailed() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const report = id ? mockDetailedReports[id] : null

  if (!report) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Отчет не найден</h2>
          <button onClick={() => navigate("/profile/report")}>
            Вернуться к отчетам
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

  const getTypeLabel = () => {
    switch (report.type) {
      case "analysis":
        return "Анализ"
      case "summary":
        return "Сводка"
      case "detailed":
        return "Детальный"
      default:
        return "Отчет"
    }
  }

  // Простой парсер Markdown для отображения контента
  const renderContent = (content: string) => {
    const lines = content.split("\n")
    const elements: React.ReactNode[] = []
    let currentParagraph: string[] = []

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      if (trimmedLine.startsWith("# ")) {
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join(" ")
          elements.push(
            <p
              key={`p-${index}`}
              className={styles.paragraph}
              dangerouslySetInnerHTML={{
                __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          )
          currentParagraph = []
        }
        elements.push(
          <h1 key={`h1-${index}`} className={styles.h1}>
            {trimmedLine.substring(2)}
          </h1>
        )
      } else if (trimmedLine.startsWith("## ")) {
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join(" ")
          elements.push(
            <p
              key={`p-${index}`}
              className={styles.paragraph}
              dangerouslySetInnerHTML={{
                __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          )
          currentParagraph = []
        }
        elements.push(
          <h2 key={`h2-${index}`} className={styles.h2}>
            {trimmedLine.substring(3)}
          </h2>
        )
      } else if (trimmedLine.startsWith("### ")) {
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join(" ")
          elements.push(
            <p
              key={`p-${index}`}
              className={styles.paragraph}
              dangerouslySetInnerHTML={{
                __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          )
          currentParagraph = []
        }
        elements.push(
          <h3 key={`h3-${index}`} className={styles.h3}>
            {trimmedLine.substring(4)}
          </h3>
        )
      } else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join(" ")
          elements.push(
            <p
              key={`p-${index}`}
              className={styles.paragraph}
              dangerouslySetInnerHTML={{
                __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          )
          currentParagraph = []
        }
        elements.push(
          <li key={`li-${index}`} className={styles.listItem}>
            {trimmedLine.substring(2)}
          </li>
        )
      } else if (trimmedLine === "") {
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join(" ")
          elements.push(
            <p
              key={`p-${index}`}
              className={styles.paragraph}
              dangerouslySetInnerHTML={{
                __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          )
          currentParagraph = []
        }
      } else {
        currentParagraph.push(trimmedLine)
      }
    })

    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ")
      elements.push(
        <p
          key="p-final"
          className={styles.paragraph}
          dangerouslySetInnerHTML={{
            __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
          }}
        />
      )
    }

    return elements
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate("/profile/report")}>
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
          <h1>{report.title}</h1>
          <p className={styles.date}>{formatDate(report.date)}</p>
        </div>
        <div className={styles.meta}>
          {report.type && <span className={styles.type}>{getTypeLabel()}</span>}
          {report.status && (
            <span className={`${styles.status} ${styles[report.status]}`}>
              {report.status === "completed" ? "Завершен" : "Черновик"}
            </span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.reportContent}>{renderContent(report.content)}</div>
      </div>
    </div>
  )
}

export default ReportDetailed

