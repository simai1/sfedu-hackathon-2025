import React, { useRef, useState } from "react"
import { Player } from "video-react"
import styles from "./VideoPlayer.module.scss"

const VideoPlayer: React.FC = () => {
  const playerRef = useRef<any | null>(null)
  const [videoURL, setVideoURL] = useState<string | null>(null)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

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
    setVideoURL(url)
  }

  // Сброс видео
  const handleReset = () => {
    setVideoURL(null)
    setFileName("")
    setScreenshots([])
    setError(null)

    const fileInput =
      document.querySelector<HTMLInputElement>("input[type=file]")
    if (fileInput) fileInput.value = ""
  }

  // Скриншот
  const captureScreenshot = () => {
    if (!playerRef.current) return

    try {
      const videoElement = playerRef.current.video.video as HTMLVideoElement

      if (
        !videoElement ||
        !videoElement.videoWidth ||
        !videoElement.videoHeight
      ) {
        setError("Видео не готово для создания скриншота")
        return
      }

      const canvas = document.createElement("canvas")
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        setError("Не удалось получить контекст canvas")
        return
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

      const img = canvas.toDataURL("image/png")
      setScreenshots((prev) => [...prev, img])
    } catch (err) {
      console.error(err)
      setError("Не удалось создать скриншот")
    }
  }

  return (
    <div
      className={styles.VideoPlayer}
      style={{ display: "flex", gap: "20px" }}
    >
      <div>
        <input type="file" accept="video/*" onChange={handleVideoUpload} />
        {fileName && <div>Загружен файл: {fileName}</div>}
        {error && <div style={{ color: "red" }}>Ошибка: {error}</div>}

        {videoURL && (
          <div style={{ marginTop: "10px" }}>
            <Player
              ref={playerRef}
              src={videoURL}
              fluid={false}
              width={640}
              height={360}
            />
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              <button onClick={captureScreenshot}>Сделать скриншот</button>
              <button onClick={handleReset}>Сбросить видео</button>
            </div>
          </div>
        )}
      </div>

      {/* Боковое меню со скриншотами */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <h3>Скриншоты</h3>
        {screenshots.length === 0 ? (
          <div style={{ color: "#999", fontStyle: "italic" }}>
            Скриншоты будут появляться здесь
          </div>
        ) : (
          screenshots.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`screenshot-${idx}`}
              style={{ width: "150px", border: "1px solid #ccc" }}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default VideoPlayer
