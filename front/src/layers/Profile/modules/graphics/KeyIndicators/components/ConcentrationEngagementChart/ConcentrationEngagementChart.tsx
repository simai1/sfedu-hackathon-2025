import { useEffect, useRef, useState } from "react"
import * as echarts from "echarts"
import { useWebSocketStore } from "../../../../../../../store/websocketStore"
import styles from "./ConcentrationEngagementChart.module.scss"

interface ChannelData {
  mind: {   
    instant_attention: number
    instant_relaxation: number
  }
}

function ConcentrationEngagementChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.EChartsType | null>(null)
  const { lastMessage } = useWebSocketStore()
  
  const [concentrationData, setConcentrationData] = useState<number[]>([])
  const [engagementData, setEngagementData] = useState<number[]>([])
  const [timeData, setTimeData] = useState<number[]>([])
  const timeCounterRef = useRef(0)

  const extractDataFromMessage = (message: any) => {
    const channels = message?.data?.channels || message?.channels
    
    if (!channels) {
      return null
    }

    const channelKeys = Object.keys(channels)
    if (channelKeys.length === 0) {
      return null
    }

    let totalAttention = 0
    let totalRelaxation = 0
    let validChannels = 0

    channelKeys.forEach((key) => {
      const channel = channels[key] as ChannelData
      if (channel?.mind) {
        totalAttention += channel.mind.instant_attention ?? 0
        totalRelaxation += channel.mind.instant_relaxation ?? 0
        validChannels++
      }
    })

    if (validChannels === 0) {
      return null
    }

    return {
      attention: totalAttention / validChannels,
      relaxation: totalRelaxation / validChannels,
    }
  }

  useEffect(() => {
    if (chartRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current)

      const option = {
        backgroundColor: "transparent",
        title: {
          text: "Концентрация и Расслабленность",
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
          data: ["Концентрация", "Расслабленность"],
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
          name: "Процент (%)",
          min: 0,
          max: 100,
          interval: 20,
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
            name: "Концентрация",
            type: "line",
            data: concentrationData,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              color: "#8B5CF6",
            },
          },
          {
            name: "Расслабленность",
            type: "line",
            data: engagementData,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              color: "#10B981",
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

    const extractedData = extractDataFromMessage(lastMessage)
    
    if (!extractedData) {
      return
    }

    const newTime = timeCounterRef.current++
    const newConcentration = Math.max(0, Math.min(100, extractedData.attention))
    const newRelaxation = Math.max(0, Math.min(100, extractedData.relaxation))

    setTimeData((prev) => {
      const updated = [...prev, newTime]
      return updated.length > 50 ? updated.slice(-50) : updated
    })

    setConcentrationData((prev) => {
      const updated = [...prev, newConcentration]
      return updated.length > 50 ? updated.slice(-50) : updated
    })

    setEngagementData((prev) => {
      const updated = [...prev, newRelaxation]
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
            name: "Концентрация",
            data: concentrationData,
          },
          {
            name: "Расслабленность",
            data: engagementData,
          },
        ],
      })
    }
  }, [timeData, concentrationData, engagementData])

  return (
    <div className={styles.chartContainer}>
      <div ref={chartRef} style={{ width: "100%", height: "400px" }}></div>
    </div>
  )
}

export default ConcentrationEngagementChart

