import React, { useEffect, useRef, useState } from "react"
import * as echarts from "echarts"
import styles from "./KeyIndicators.module.scss"

let concentrationData: number[] = []
let engagementData: number[] = []
let timeData: number[] = []

for (let i = 0; i < 20; i++) {
  timeData.push(i)
  concentrationData.push(Math.floor(Math.random() * 101))
  engagementData.push(Math.floor(Math.random() * 101))
}

function KeyIndicators() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.EChartsType | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (chartRef.current) {
      // Initialize the chart
      chartInstanceRef.current = echarts.init(chartRef.current)

      // Chart options
      const option = {
        backgroundColor: "transparent",
        title: {
          text: "Показатели концентрации и вовлеченности",
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
          data: ["Концентрация", "Вовлеченность"],
          top: "0%",
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
          axisTick: {
            lineStyle: {
              color: "#9ca3af",
            },
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
          axisTick: {
            lineStyle: {
              color: "#9ca3af",
            },
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
            symbolSize: 8,
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              color: "#8B5CF6", // Purple color for concentration
            },
          },
          {
            name: "Вовлеченность",
            type: "line",
            data: engagementData,
            smooth: true,
            symbol: "circle",
            symbolSize: 8,
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              color: "#10B981", // Green color for engagement
            },
          },
        ],
      }

      // Set the options
      chartInstanceRef.current.setOption(option)

      // Handle window resize
      const handleResize = () => {
        chartInstanceRef.current?.resize()
      }

      window.addEventListener("resize", handleResize)

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        chartInstanceRef.current?.dispose()
      }
    }
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (chartInstanceRef.current) {
        const newTime =
          timeData.length > 0 ? timeData[timeData.length - 1] + 1 : 0
        const newConcentration = Math.max(
          0,
          Math.min(
            100,
            concentrationData[concentrationData.length - 1] +
              (Math.random() * 20 - 10)
          )
        )
        const newEngagement = Math.max(
          0,
          Math.min(
            100,
            engagementData[engagementData.length - 1] +
              (Math.random() * 20 - 10)
          )
        )

        // Update data arrays
        timeData.push(newTime)
        concentrationData.push(newConcentration)
        engagementData.push(newEngagement)

        // Keep only the last 50 data points for better performance
        if (timeData.length > 20) {
          timeData.shift()
          concentrationData.shift()
          engagementData.shift()
        }

        // Update chart with new data
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
              name: "Вовлеченность",
              data: engagementData,
            },
          ],
        })
      }
    }, 500) // Update every second

    // Cleanup interval
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className={styles.KeyIndicators}>
      <div ref={chartRef} style={{ width: "100%", height: "500px" }}></div>
    </div>
  )
}

export default KeyIndicators
