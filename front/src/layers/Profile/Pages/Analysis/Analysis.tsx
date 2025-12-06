import { useState, useEffect, useRef } from "react"
import ChatMessagerComponent from "../../../../core/components/ChatMessagerComponent/ChatMessagerComponent"
import KeyIndicators from "../../modules/graphics/KeyIndicators/KeyIndicators"
import UploadFile from "../../../../core/components/UploadFile/UploadFile"
import VideoPlayer, { type ScreenshotTrigger } from "../../../../core/components/VideoPlayer/VideoPlayer"
import { uploadVideo } from "../../../../api/files"
import styles from "./Analysis.module.scss"

type AnalysisState = "upload" | "ready" | "watching" | "finished" | "reportGenerated"

function Analysis() {
  const [state, setState] = useState<AnalysisState>("upload")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoURL, setVideoURL] = useState<string | null>(null)
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isReportGenerating, setIsReportGenerating] = useState(false)
  const [screenshotTriggers, setScreenshotTriggers] = useState<ScreenshotTrigger[]>([])
  const [capturedScreenshots, setCapturedScreenshots] = useState<any[]>([])
  const videoDurationRef = useRef<number>(0)

  const handleFileSelect = async (file: File | null) => {
    if (file && file.type.startsWith("video/")) {
      setUploadError(null)
      setIsUploading(true)
      setVideoFile(file)

      // Локальный URL для предпросмотра и триггеров
      const localUrl = URL.createObjectURL(file)
      setVideoURL(localUrl)

      const video = document.createElement("video")
      video.preload = "metadata"
      video.src = localUrl
      video.onloadedmetadata = () => {
        videoDurationRef.current = video.duration
        const triggers = generateScreenshotTriggers(video.duration)
        setScreenshotTriggers(triggers)
        video.remove()
      }

      try {
        const response = await uploadVideo(file)
        const data = response?.data
        if (data?.id) setUploadedVideoId(data.id)
        if (data?.url || data?.video_url) setUploadedVideoUrl(data.url || data.video_url)
        setState("ready")
        connectToSocket()
      } catch (error) {
        console.error("Ошибка загрузки видео", error)
        setUploadError("Не удалось загрузить видео. Попробуйте еще раз.")
        setState("upload")
        setVideoFile(null)
        setVideoURL(null)
        setScreenshotTriggers([])
      } finally {
        setIsUploading(false)
      }
    }
  }

  const connectToSocket = () => {
    setTimeout(() => {
      setIsSocketConnected(true)
    }, 1000)
  }
  const generateScreenshotTriggers = (duration: number) => {
    const triggers: ScreenshotTrigger[] = []
    for (let time = 0; time < duration; time += 2) {
      triggers.push({
        type: "custom",
        timestamp: time,
        message: `Автоматический скриншот`,
      })
    }
    return triggers
  }

  const handleStartWatching = () => {
    if (videoURL && isSocketConnected) {
      setState("watching")
      setIsAnalyzing(true)
      
      if (screenshotTriggers.length === 0 && videoDurationRef.current > 0) {
        const triggers = generateScreenshotTriggers(videoDurationRef.current)
        setScreenshotTriggers(triggers)
      }
    }
  }

  const handleVideoEnd = () => {
    setIsAnalyzing(false)
    setState("finished")
  }

  const handleGenerateReport = async () => {
    setIsReportGenerating(true)
    
    setTimeout(() => {
      setIsReportGenerating(false)
      setState("reportGenerated")
    }, 2000)
  }

  const handleSaveReport = async () => {
    console.log("Сохранение отчета:", {
      screenshots: capturedScreenshots,
      stats: {
        totalTime: "120 часов",
        completedTasks: 42,
        engagement: "85%",
      },
    })
    
    alert("Отчет успешно сохранен!")
  }
  const handleScreenshot = (screenshot: any) => {
    setCapturedScreenshots((prev) => [...prev, screenshot])
    console.log("Скриншот создан:", screenshot)
  }

  const handleReset = () => {
    if (videoURL) {
      URL.revokeObjectURL(videoURL)
    }
    setVideoFile(null)
    setVideoURL(null)
    setUploadedVideoId(null)
    setUploadedVideoUrl(null)
    setUploadError(null)
    setIsSocketConnected(false)
    setIsAnalyzing(false)
    setIsReportGenerating(false)
    setState("upload")
    setScreenshotTriggers([])
    setCapturedScreenshots([])
    videoDurationRef.current = 0
  }


  useEffect(() => {
    return () => {
      if (videoURL) {
        URL.revokeObjectURL(videoURL)
      }
    }
  }, [videoURL])

  return (
    <div className={styles.analysisContainer}>
      <div className={styles.analysis}>
        <h1>Анализ активности</h1>

        {state === "upload" && (
          <div className={styles.uploadSection}>
            <p className={styles.uploadPrompt}>Загрузите видео файл</p>
            <div className={styles.uploadWrapper}>
              <UploadFile onFileSelect={handleFileSelect} />
            </div>
            {isUploading && <p className={styles.uploadStatus}>Загружаем видео на сервер...</p>}
            {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
          </div>
        )}

        {state === "ready" && (
          <div className={styles.readySection}>
            <div className={styles.connectionStatus}>
              {isSocketConnected ? (
                <div className={styles.statusConnected}>
                  <span className={styles.statusDot}></span>
                  Соединение с сервером установлено
                </div>
              ) : (
                <div className={styles.statusConnecting}>
                  <span className={styles.statusDot}></span>
                  Подключение к серверу...
                </div>
              )}
            </div>
            
            {videoFile && (
              <div className={styles.videoInfo}>
                <p>Файл: {videoFile.name}</p>
                <p>Размер: {(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}

            {uploadedVideoId && (
              <div className={styles.videoInfo}>
                <p>ID видео: {uploadedVideoId}</p>
                {uploadedVideoUrl && <p>Ссылка: {uploadedVideoUrl}</p>}
              </div>
            )}

            <div className={styles.chartContainer}>
              <KeyIndicators />
            </div>

            <div className={styles.actionButtons}>
              <button
                className={styles.startButton}
                onClick={handleStartWatching}
                disabled={!isSocketConnected || isUploading}
              >
                Начать просмотр
              </button>
              <button className={styles.resetButton} onClick={handleReset}>
                Загрузить другое видео
              </button>
            </div>
          </div>
        )}

        {state === "watching" && (
          <div className={styles.watchingSection}>
            <div className={styles.videoPlayerContainer}>
              {videoURL && (
                <VideoPlayer
                  videoURL={videoURL}
                  triggers={screenshotTriggers}
                  autoCapture={true}
                  autoPlay={true}
                  showManualCapture={false}
                  onVideoEnd={handleVideoEnd}
                  onScreenshot={handleScreenshot}
                />
              )}
            </div>

            <div className={styles.chartContainer}>
              <KeyIndicators />
            </div>

            {isAnalyzing && (
              <div className={styles.analyzingIndicator}>
                <span className={styles.analyzingDot}></span>
                Идет анализ метрик...
              </div>
            )}

            <div className={styles.actionButtons}>
              <button className={styles.resetButton} onClick={handleReset}>
                Остановить и загрузить другое
              </button>
            </div>
          </div>
        )}

        {state === "finished" && (
          <div className={styles.finishedSection}>
            <div className={styles.videoPlayerContainer}>
              {videoURL && (
                <VideoPlayer
                  videoURL={videoURL}
                  triggers={screenshotTriggers}
                  autoCapture={false}
                  autoPlay={false}
                  showManualCapture={false}
                  onVideoEnd={handleVideoEnd}
                  onScreenshot={handleScreenshot}
                />
              )}
            </div>

            <div className={styles.chartContainer}>
              <KeyIndicators />
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <h3>Общее время</h3>
                <p>120 часов</p>
              </div>
              <div className={styles.statItem}>
                <h3>Завершенные задачи</h3>
                <p>42</p>
              </div>
              <div className={styles.statItem}>
                <h3>Уровень вовлеченности</h3>
                <p>85%</p>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button
                className={styles.generateButton}
                onClick={handleGenerateReport}
                disabled={isReportGenerating}
              >
                {isReportGenerating ? "Генерация отчета..." : "Сгенерировать отчет"}
              </button>
              <button className={styles.resetButton} onClick={handleReset}>
                Загрузить новое видео
              </button>
            </div>
          </div>
        )}

        {state === "reportGenerated" && (
          <div className={styles.reportSection}>
            <div className={styles.reportHeader}>
              <h2>Отчет сгенерирован</h2>
              <p>Теперь вы можете задать вопросы о результатах анализа</p>
            </div>

            <div className={styles.chartContainer}>
              <KeyIndicators />
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <h3>Общее время</h3>
                <p>120 часов</p>
              </div>
              <div className={styles.statItem}>
                <h3>Завершенные задачи</h3>
                <p>42</p>
              </div>
              <div className={styles.statItem}>
                <h3>Уровень вовлеченности</h3>
                <p>85%</p>
              </div>
            </div>

            {/* Скриншоты с максимальными активностями */}
            {capturedScreenshots.length > 0 && (
              <div className={styles.screenshotsSection}>
                <h3>Скриншоты с активностями ({capturedScreenshots.length})</h3>
                <div className={styles.screenshotsGrid}>
                  {capturedScreenshots.map((screenshot) => (
                    <div key={screenshot.id} className={styles.screenshotCard}>
                      <div className={styles.screenshotImage}>
                        <img src={screenshot.image} alt={`Screenshot at ${screenshot.formattedTime}`} />
                        <div className={styles.screenshotTime}>{screenshot.formattedTime}</div>
                      </div>
                      <div className={styles.screenshotInfo}>
                        <div className={styles.screenshotTrigger}>
                          {screenshot.trigger.type === "concentration_increase" && "🧠"}
                          {screenshot.trigger.type === "engagement_increase" && "❤️"}
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actionButtons}>
              <button
                className={styles.saveButton}
                onClick={handleSaveReport}
              >
                Сохранить отчет
              </button>
              <button className={styles.resetButton} onClick={handleReset}>
                Начать заново
              </button>
            </div>
          </div>
        )}
      </div>

      {state === "reportGenerated" && (
        <div className={styles.chat}>
          <ChatMessagerComponent />
        </div>
      )}
    </div>
  )
}

export default Analysis
