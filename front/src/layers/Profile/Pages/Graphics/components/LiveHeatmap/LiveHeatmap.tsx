import { useEffect, useMemo, useRef, useState } from "react"
import { useWebSocketStore } from "../../../../../../store/websocketStore"
import styles from "./LiveHeatmap.module.scss"
import brainSvg from "../../../../../../assets/img/photos/brain.svg"

type HeatmapMode = "engagement" | "attention"

type ChannelPoint = {
  x: number
  y: number
  value: number
}

// Простейшая раскладка электродов в координатах канваса (0..1)
const CHANNEL_POS: Record<string, { x: number; y: number }> = {
  O1: { x: 0.35, y: 0.2 },
  O2: { x: 0.65, y: 0.2 },
  T3: { x: 0.25, y: 0.55 },
  T4: { x: 0.75, y: 0.55 },
}

interface LiveHeatmapProps {
  mode: HeatmapMode
}

const MAX_POINTS = 100

const palette = [
  [0, 255, 0],
  [255, 255, 0],
  [255, 165, 0],
  [255, 69, 0],
  [255, 0, 0],
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function getColor(intensity: number) {
  // intensity 0..1
  const idx = intensity * (palette.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.min(palette.length - 1, lo + 1)
  const t = idx - lo
  const [r1, g1, b1] = palette[lo]
  const [r2, g2, b2] = palette[hi]
  return `rgba(${Math.round(lerp(r1, r2, t))}, ${Math.round(lerp(g1, g2, t))}, ${Math.round(
    lerp(b1, b2, t)
  )}, 0.65)`
}

function LiveHeatmap({ mode }: LiveHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { lastMessage } = useWebSocketStore()
  const [points, setPoints] = useState<ChannelPoint[]>([])
  const [lastValues, setLastValues] = useState<Record<string, number>>({})
  const brainImgRef = useRef<HTMLImageElement | null>(null)

  const metricKey = useMemo(() => {
    // engagement -> relative_attention; attention -> instant_attention
    return mode === "engagement" ? "relative_attention" : "instant_attention"
  }, [mode])

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== "eeg_sample") return
    const ch = lastMessage?.data?.channels || lastMessage?.channels
    if (!ch) return
    const newPoints: ChannelPoint[] = []
    const newVals: Record<string, number> = {}
    Object.keys(CHANNEL_POS).forEach((name) => {
      const pos = CHANNEL_POS[name]
      const value = ch?.[name]?.mind?.[metricKey]
      if (typeof value === "number") {
        newPoints.push({ x: pos.x, y: pos.y, value })
        newVals[name] = value
      }
    })
    if (newPoints.length === 0) return
    setPoints((prev) => {
      const updated = [...prev, ...newPoints].slice(-MAX_POINTS)
      return updated
    })
    if (Object.keys(newVals).length > 0) {
      setLastValues((prev) => ({ ...prev, ...newVals }))
    }
  }, [lastMessage, metricKey])

  useEffect(() => {
    const img = new Image()
    img.src = brainSvg
    img.onload = () => {
      brainImgRef.current = img
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    if (brainImgRef.current) {
      ctx.globalAlpha = 0.25
      ctx.drawImage(brainImgRef.current, 0, 0, w, h)
      ctx.globalAlpha = 1
    }

    if (points.length === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.1)"
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = "#888"
      ctx.font = "14px sans-serif"
      ctx.fillText("Ожидаем данные с датчиков...", 12, 22)
      return
    }

    const maxVal = Math.max(...points.map((p) => p.value), 1)

    Object.keys(CHANNEL_POS).forEach((name) => {
      const pos = CHANNEL_POS[name]
      const val = lastValues[name]
      if (typeof val !== "number") return
      const intensity = Math.min(val / maxVal, 1)
      const x = pos.x * w
      const y = pos.y * h
      const radius = 80
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
      grad.addColorStop(0, getColor(intensity))
      grad.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = "#fff"
    ctx.strokeStyle = "rgba(255,255,255,0.4)"
    Object.keys(CHANNEL_POS).forEach((name) => {
      const pos = CHANNEL_POS[name]
      const x = pos.x * w
      const y = pos.y * h
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeText(name, x + 8, y + 4)
    })
  }, [points])

  return (
    <div className={styles.heatmapCard}>
      <div className={styles.heatmapHeader}>
        <span>
          Тепловая карта {mode === "engagement" ? "вовлеченности" : "концентрации"}
        </span>
        <span className={styles.badge}>Live</span>
      </div>
      <canvas ref={canvasRef} width={540} height={540} className={styles.canvas} />
      <div className={styles.legend}>
        <span>Низкое</span>
        <div className={styles.legendBar} />
        <span>Высокое</span>
      </div>
    </div>
  )
}

export default LiveHeatmap

