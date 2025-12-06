import { useEffect, useRef, useState } from "react"
import * as echarts from "echarts"
import { useWebSocketStore } from "../../../../../../../store/websocketStore"
import styles from "./ChannelsCharts.module.scss"

interface ChannelData {
  mind: {
    instant_attention: number
    instant_relaxation: number
  }
}

type ChannelKey = "O1" | "O2" | "T3" | "T4"

interface ChannelChartProps {
  channelKey: ChannelKey
  channelName: string
  color: string
}

function ChannelChart({ channelKey, channelName, color }: ChannelChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.EChartsType | null>(null)
  const { lastMessage } = useWebSocketStore()
  
  const [attentionData, setAttentionData] = useState<number[]>([])
  const [relaxationData, setRelaxationData] = useState<number[]>([])
  const [timeData, setTimeData] = useState<number[]>([])
  const timeCounterRef = useRef(0)

  const extractChannelData = (message: any, key: ChannelKey) => {
    const channels = message?.data?.channels || message?.channels
    
    if (!channels || !channels[key]) {
      return null
    }

    const channel = channels[key] as ChannelData
    if (!channel?.mind) {
      return null
    }

    return {
      attention: channel.mind.instant_attention  ?? 0,
      relaxation: channel.mind.instant_relaxation ?? 0,
    }
  }

  useEffect(() => {
    if (chartRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current)

      const option = {
        backgroundColor: "transparent",
        title: {
          text: channelName,
          left: "center",
          textStyle: {
            fontSize: 14,
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
          data: ["Концентрация", "Расслабление"],
          top: "15%",
          textStyle: {
            color: "#f3f4f6",
            fontSize: 12,
          },
        },
        xAxis: {
          type: "category",
          data: timeData,
          axisLine: {
            lineStyle: {
              color: "#9ca3af",
            },
          },
          axisLabel: {
            color: "#d1d5db",
            fontSize: 10,
          },
        },
        yAxis: {
          type: "value",
          min: 0,
          max: 100,
          axisLine: {
            lineStyle: {
              color: "#9ca3af",
            },
          },
          axisLabel: {
            color: "#d1d5db",
            fontSize: 10,
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
            data: attentionData,
            smooth: true,
            symbol: "none",
            lineStyle: {
              width: 2,
              color: color,
            },
            itemStyle: {
              color: color,
            },
          },
          {
            name: "Расслабление",
            type: "line",
            data: relaxationData,
            smooth: true,
            symbol: "none",
            lineStyle: {
              width: 2,
              color: "#10B981",
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
  }, [channelName, color])

  useEffect(() => {
    if (!lastMessage || !chartInstanceRef.current) {
      return
    }

    const channelData = extractChannelData(lastMessage, channelKey)
    
    if (!channelData) {
      return
    }

    const newTime = timeCounterRef.current++
    const newAttention = Math.max(0, Math.min(100, channelData.attention))
    const newRelaxation = Math.max(0, Math.min(100, channelData.relaxation))

    setTimeData((prev) => {
      const updated = [...prev, newTime]
      return updated.length > 30 ? updated.slice(-30) : updated
    })

    setAttentionData((prev) => {
      const updated = [...prev, newAttention]
      return updated.length > 30 ? updated.slice(-30) : updated
    })

    setRelaxationData((prev) => {
      const updated = [...prev, newRelaxation]
      return updated.length > 30 ? updated.slice(-30) : updated
    })
  }, [lastMessage, channelKey])

  useEffect(() => {
    if (chartInstanceRef.current && timeData.length > 0) {
      chartInstanceRef.current.setOption({
        xAxis: {
          data: timeData,
        },
        series: [
          {
            name: "Концентрация",
            data: attentionData,
          },
          {
            name: "Расслабление",
            data: relaxationData,
          },
        ],
      })
    }
  }, [timeData, attentionData, relaxationData])

  return (
    <div className={styles.channelChart}>
      <div ref={chartRef} className={styles.chartWrapper}></div>
    </div>
  )
}

function ChannelsCharts() {
  return (
    <div className={styles.channelsContainer}>
      <h3 className={styles.title}>Каналы</h3>
      <div className={styles.channelsGrid}>
        <ChannelChart channelKey="O1" channelName="O1" color="#F59E0B" />
        <ChannelChart channelKey="O2" channelName="O2" color="#EF4444" />
        <ChannelChart channelKey="T3" channelName="T3" color="#3B82F6" />
        <ChannelChart channelKey="T4" channelName="T4" color="#EC4899" />
      </div>
    </div>
  )
}

export default ChannelsCharts

