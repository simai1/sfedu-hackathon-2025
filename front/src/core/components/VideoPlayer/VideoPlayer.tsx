import React, { useRef, useState, useEffect, useCallback } from "react"
import { Camera, X, Download, TrendingUp, Brain, Heart, AlertCircle } from "lucide-react"
import styles from "./VideoPlayer.module.scss"

export interface ScreenshotTrigger {
  type: "concentration_increase" | "engagement_increase" | "stress_peak" | "attention_peak" | "custom"
  timestamp: number // время в секундах
  value?: number // значение метрики
  message?: string // описание триггера
}

interface Screenshot {
  id: string
  image: string
  timestamp: number
  trigger: ScreenshotTrigger
  formattedTime: string
}

interface VideoPlayerProps {
  videoURL?: string | null
  onVideoLoad?: (file: File) => void
  triggers?: ScreenshotTrigger[] // Автоматические триггеры
  onScreenshot?: (screenshot: Screenshot) => void // Callback при создании скриншота
  onVideoEnd?: () => void // Callback при окончании видео
  autoCapture?: boolean // Автоматически делать скриншоты при триггерах
  autoPlay?: boolean // Автоматически запускать видео
  showManualCapture?: boolean // Показывать кнопку ручного скриншота
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoURL: externalVideoURL,
  onVideoLoad,
  triggers = [],
  onScreenshot,
  onVideoEnd,
  autoCapture = true,
  autoPlay = false,
  showManualCapture = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [internalVideoURL, setInternalVideoURL] = useState<string | null>(null)
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const processedTriggersRef = useRef<Set<string>>(new Set())

  const videoURL = externalVideoURL || internalVideoURL

  // Форматирование времени
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Получение иконки для типа триггера
  const getTriggerIcon = (type: ScreenshotTrigger["type"]) => {
    switch (type) {
      case "concentration_increase":
        return <Brain size={16} />
      case "engagement_increase":
        return <Heart size={16} />
      case "stress_peak":
        return <AlertCircle size={16} />
      case "attention_peak":
        return <TrendingUp size={16} />
      default:
        return <Camera size={16} />
    }
  }

  // Получение цвета для типа триггера
  const getTriggerColor = (type: ScreenshotTrigger["type"]): string => {
    switch (type) {
      case "concentration_increase":
        return "var(--purple-400)"
      case "engagement_increase":
        return "var(--green-400)"
      case "stress_peak":
        return "var(--red-400)"
      case "attention_peak":
        return "var(--purple-500)"
      default:
        return "var(--white-400)"
    }
  }

  // Получение названия триггера
  const getTriggerLabel = (trigger: ScreenshotTrigger): string => {
    switch (trigger.type) {
      case "concentration_increase":
        return `Увеличение концентрации${trigger.value ? ` (${trigger.value}%)` : ""}`
      case "engagement_increase":
        return `Рост вовлеченности${trigger.value ? ` (${trigger.value}%)` : ""}`
      case "stress_peak":
        return `Пик стресса${trigger.value ? ` (${trigger.value}%)` : ""}`
      case "attention_peak":
        return `Пик внимания${trigger.value ? ` (${trigger.value}%)` : ""}`
      default:
        return trigger.message || "Событие"
    }
  }

  // Создание скриншота
  const captureScreenshot = useCallback(
    (trigger?: ScreenshotTrigger) => {
      if (!videoRef.current) return

      const video = videoRef.current

      if (!video.videoWidth || !video.videoHeight) {
        setError("Видео не готово для создания скриншота")
        return
      }

      try {
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          setError("Не удалось получить контекст canvas")
          return
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = canvas.toDataURL("image/png")

        const timestamp = video.currentTime
        const screenshot: Screenshot = {
          id: Date.now().toString(),
          image: imageData,
          timestamp,
          trigger: trigger || {
            type: "custom",
            timestamp,
            message: "Ручной скриншот",
          },
          formattedTime: formatTime(timestamp),
        }

        setScreenshots((prev) => [...prev, screenshot])
        if (onScreenshot) {
          onScreenshot(screenshot)
        }
      } catch (err) {
        console.error("Ошибка при создании скриншота:", err)
        setError("Не удалось создать скриншот")
      }
    },
    [onScreenshot]
  )

  // Обработка триггеров
  useEffect(() => {
    if (!autoCapture || !videoRef.current || triggers.length === 0) return

    const video = videoRef.current
    const checkTriggers = () => {
      const currentTime = video.currentTime

      triggers.forEach((trigger) => {
        const triggerKey = `${trigger.type}-${trigger.timestamp}`
        
        // Проверяем, не обработан ли уже этот триггер
        if (processedTriggersRef.current.has(triggerKey)) return

        // Проверяем, достигли ли мы времени триггера (с небольшой погрешностью)
        if (Math.abs(currentTime - trigger.timestamp) < 0.5) {
          processedTriggersRef.current.add(triggerKey)
          captureScreenshot(trigger)
        }
      })
    }

    const interval = setInterval(checkTriggers, 100) // Проверяем каждые 100мс

    return () => clearInterval(interval)
  }, [triggers, autoCapture, captureScreenshot])

  // Загрузка видео
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("video/")) {
      setError("Пожалуйста, выберите видео файл")
      return
    }

    setError(null)
    setFileName(file.name)

    const url = URL.createObjectURL(file)
    setInternalVideoURL(url)

    if (onVideoLoad) {
      onVideoLoad(file)
    }
  }

  // Сброс видео
  const handleReset = () => {
    if (internalVideoURL) {
      URL.revokeObjectURL(internalVideoURL)
    }
    setInternalVideoURL(null)
    setFileName("")
    setScreenshots([])
    setError(null)
    setCurrentTime(0)
    setDuration(0)
    processedTriggersRef.current.clear()

    const fileInput = document.querySelector<HTMLInputElement>("input[type=file]")
    if (fileInput) fileInput.value = ""

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  // Обработчики видео
  const handlePlay = () => {
    // Видео воспроизводится
  }

  const handlePause = () => {
    // Видео приостановлено
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      // Автозапуск видео если включен
      if (autoPlay) {
        videoRef.current.play().catch((err) => {
          console.error("Ошибка автозапуска видео:", err)
        })
      }
    }
  }

  const handleVideoEnd = () => {
    if (onVideoEnd) {
      onVideoEnd()
    }
  }

  // Скачивание скриншота
  const downloadScreenshot = (screenshot: Screenshot) => {
    const link = document.createElement("a")
    link.download = `screenshot-${screenshot.formattedTime.replace(":", "-")}.png`
    link.href = screenshot.image
    link.click()
  }

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (internalVideoURL) {
        URL.revokeObjectURL(internalVideoURL)
      }
    }
  }, [internalVideoURL])

  return (
    <div className={styles.VideoPlayer}>
      <div className={styles.mainContent}>
        <div className={styles.videoSection}>
          {!videoURL ? (
            <div className={styles.uploadArea}>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className={styles.fileInput}
                id="video-upload"
              />
              <label htmlFor="video-upload" className={styles.uploadLabel}>
                <Camera size={32} />
                <span>Загрузите видео файл</span>
              </label>
            </div>
          ) : (
            <>
              {fileName && (
                <div className={styles.fileInfo}>
                  <span>{fileName}</span>
                  <button onClick={handleReset} className={styles.resetButton}>
                    <X size={16} />
                  </button>
                </div>
              )}
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.videoContainer}>
                <video
                  ref={videoRef}
                  src={videoURL}
                  controls
                  className={styles.video}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleVideoEnd}
                />
                <div className={styles.videoControls}>
                  <div className={styles.timeInfo}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  {showManualCapture && (
                    <button
                      onClick={() => captureScreenshot()}
                      className={styles.captureButton}
                      title="Сделать скриншот"
                    >
                      <Camera size={20} />
                      Скриншот
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Боковая панель со скриншотами */}
        {screenshots.length > 0 && (
          <div className={styles.screenshotsPanel}>
            <div className={styles.screenshotsHeader}>
              <h3>Скриншоты ({screenshots.length})</h3>
              <button
                onClick={() => setScreenshots([])}
                className={styles.clearButton}
                title="Очистить все"
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.screenshotsList}>
              {screenshots.map((screenshot) => (
                <div key={screenshot.id} className={styles.screenshotItem}>
                  <div className={styles.screenshotImage}>
                    <img src={screenshot.image} alt={`Screenshot at ${screenshot.formattedTime}`} />
                    <div className={styles.screenshotOverlay}>
                      <button
                        onClick={() => downloadScreenshot(screenshot)}
                        className={styles.downloadButton}
                        title="Скачать"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.screenshotInfo}>
                    <div className={styles.screenshotTime}>{screenshot.formattedTime}</div>
                    <div
                      className={styles.screenshotTrigger}
                      style={{ color: getTriggerColor(screenshot.trigger.type) }}
                    >
                      {getTriggerIcon(screenshot.trigger.type)}
                      <span>{getTriggerLabel(screenshot.trigger)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoPlayer
