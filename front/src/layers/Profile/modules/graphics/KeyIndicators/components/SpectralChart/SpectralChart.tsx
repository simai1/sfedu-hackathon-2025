import { useEffect, useRef, useState } from "react"
import * as echarts from "echarts"
import { useWebSocketStore } from "../../../../../../../store/websocketStore"
import styles from "./SpectralChart.module.scss"

interface ChannelData {
  spectral: {
    alpha: number
    beta: number
    gamma: number
    delta: number
    theta: number
  }
}

function SpectralChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.EChartsType | null>(null)
  const { lastMessage } = useWebSocketStore()
  
  const [alphaData, setAlphaData] = useState<number[]>([])
  const [betaData, setBetaData] = useState<number[]>([])
  const [gammaData, setGammaData] = useState<number[]>([])
  const [deltaData, setDeltaData] = useState<number[]>([])
  const [timeData, setTimeData] = useState<number[]>([])
  const timeCounterRef = useRef(0)

  const extractSpectralData = (message: any) => {
    const channels = message?.data?.channels || message?.channels
    
    if (!channels) {
      return null
    }

    const channelKeys = Object.keys(channels)
    if (channelKeys.length === 0) {
      return null
    }

    let totalAlpha = 0
    let totalBeta = 0
    let totalGamma = 0
    let validChannels = 0
    let totalDelta = 0

    channelKeys.forEach((key) => {
      const channel = channels[key] as ChannelData
      if (channel?.spectral) {
        totalAlpha += channel.spectral.alpha ?? 0
        totalBeta += channel.spectral.beta ?? 0
        totalGamma += channel.spectral.gamma ?? 0
        totalDelta += channel.spectral.delta ?? 0
        validChannels++
      }
    })

    if (validChannels === 0) {
      return null
    }

    return {
      alpha: totalAlpha / validChannels,
      beta: totalBeta / validChannels,
      gamma: totalGamma / validChannels,
      delta: totalDelta / validChannels,
    }
  }

  useEffect(() => {
    if (chartRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current)

      const option = {
        backgroundColor: "transparent",
        title: {
          text: "Спектральные показатели",
          left: "center",
          textStyle: {
            fontSize: 16,
            fontWeight: "normal",
            color: "#f3f4f6",
          },
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(31, 41, 55, 0.9)",
          borderColor: "#4b5563",
          textStyle: {
            color: "#f3f4f6",
          },
        },
        legend: {
          data: ["Alpha", "Beta", "Gamma", "Delta"],
          top: "10%",
          textStyle: {
            color: "#f3f4f6",
          },
        },
        xAxis: {
          type: "category",
          name: "Время (секунды)",
          nameLocation: "middle",
          nameGap: 30,
          data: timeData,
          axisLine: {
            lineStyle: {
              color: "#9ca3af",
            },
          },
          axisLabel: {
            color: "#d1d5db",
          },
        },
        yAxis: {
          type: "value",
          name: "Значение",
          min: 0,
          max: 1,
          interval: 0.2,
          axisLine: {
            lineStyle: {
              color: "#9ca3af",
            },
          },
          axisLabel: {
            color: "#d1d5db",
          },
          splitLine: {
            lineStyle: {
              color: "#374151",
            },
          },
        },
        series: [
          {
            name: "Alpha",
            type: "line",
            data: alphaData,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              color: "#14B8A6",
            },
          },
          {
            name: "Beta",
            type: "line",
            data: betaData,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              color: "#A855F7",
            },
          },
          {
            name: "Gamma",
            type: "line",
            data: gammaData,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              color: "#F59E0B",
            },
          },
          {
            name: "Delta",
            type: "line",
            data: deltaData,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              color: "#EAB308",
            },
          },
        ],
      }

      chartInstanceRef.current.setOption(option)

      const handleResize = () => {
        chartInstanceRef.current?.resize()
      }

      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        chartInstanceRef.current?.dispose()
      }
    }
  }, [])

  useEffect(() => {
    if (!lastMessage || !chartInstanceRef.current) {
      return
    }

    const spectralData = extractSpectralData(lastMessage)
    
    if (!spectralData) {
      return
    }

    const newTime = timeCounterRef.current++
    const newAlpha = Math.max(0, Math.min(1, spectralData.alpha))
    const newBeta = Math.max(0, Math.min(1, spectralData.beta))
    const newGamma = Math.max(0, Math.min(1, spectralData.gamma))

    setTimeData((prev) => {
      const updated = [...prev, newTime]
      return updated.length > 50 ? updated.slice(-50) : updated
    })

    setAlphaData((prev) => {
      const updated = [...prev, newAlpha]
      return updated.length > 50 ? updated.slice(-50) : updated
    })

    setBetaData((prev) => {
      const updated = [...prev, newBeta]
      return updated.length > 50 ? updated.slice(-50) : updated
    })

    setGammaData((prev) => {
      const updated = [...prev, newGamma]
      return updated.length > 50 ? updated.slice(-50) : updated
    })
  }, [lastMessage])

  useEffect(() => {
    if (chartInstanceRef.current && timeData.length > 0) {
      chartInstanceRef.current.setOption({
        xAxis: {
          data: timeData,
        },
        series: [
          {
            name: "Alpha",
            data: alphaData,
          },
          {
            name: "Beta",
            data: betaData,
          },
          {
            name: "Gamma",
            data: gammaData,
          },
        ],
      })
    }
  }, [timeData, alphaData, betaData, gammaData])

  return (
    <div className={styles.chartContainer}>
      <div ref={chartRef} style={{ width: "100%", height: "400px" }}></div>
    </div>
  )
}

export default SpectralChart

