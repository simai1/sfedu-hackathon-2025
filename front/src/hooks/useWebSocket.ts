import { useEffect, useRef, useCallback } from "react"
import { useUserStore } from "../store/userStore"
import { useWebSocketStore } from "../store/websocketStore"
import { WEBSOCKET_BASE_URL, WEBSOCKET_CLIENT_ENDPOINT } from "../utils/apiPath"

interface UseWebSocketOptions {
  onMessage?: (message: any) => void
  onError?: (error: Event) => void
  onConnect?: () => void
  onDisconnect?: () => void
  autoConnect?: boolean
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { token } = useUserStore()
  const { status, setStatus, setLastMessage } = useWebSocketStore()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    autoConnect = true,
  } = options

  // Сохраняем колбэки в ref, чтобы избежать ререндеров
  const callbacksRef = useRef({
    onMessage,
    onError,
    onConnect,
    onDisconnect,
  })

  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onError,
      onConnect,
      onDisconnect,
    }
  }, [onMessage, onError, onConnect, onDisconnect])

  const connect = useCallback(() => {
    if (!token) {
      console.log("Нет токена для подключения к WebSocket")
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket уже подключен")
      return
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log("WebSocket уже подключается")
      return
    }

    try {
      const wsUrl = `${WEBSOCKET_BASE_URL}${WEBSOCKET_CLIENT_ENDPOINT}?token=${token}`
      console.log("Подключение к WebSocket:", wsUrl)
      setStatus("connecting")

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log("WebSocket подключен")
        setStatus("connected")
        reconnectAttempts.current = 0
        callbacksRef.current.onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          callbacksRef.current.onMessage?.(data)
        } catch (error) {
          console.error("Ошибка парсинга сообщения:", error)
          setLastMessage(event.data)
          callbacksRef.current.onMessage?.(event.data)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket ошибка:", error)
        setStatus("error")
        callbacksRef.current.onError?.(error)
      }

      ws.onclose = (event) => {
        console.log("WebSocket закрыт:", event.code, event.reason)
        setStatus("disconnected")
        callbacksRef.current.onDisconnect?.()

        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(
            `Попытка переподключения ${reconnectAttempts.current}/${maxReconnectAttempts} через ${reconnectDelay}ms`
          )
          reconnectTimeoutRef.current = setTimeout(() => {
            if (token) {
              connect()
            }
          }, reconnectDelay)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error("Ошибка создания WebSocket:", error)
      setStatus("error")
    }
  }, [token, setStatus, setLastMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Закрыто пользователем")
      wsRef.current = null
    }
    setStatus("disconnected")
  }, [setStatus])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn("WebSocket не подключен, сообщение не отправлено")
    }
  }, [])

  useEffect(() => {
    if (!autoConnect) return

    const currentToken = token

    if (currentToken) {
      // Проверяем, не подключен ли уже WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return
      }

      // Если есть старое соединение, закрываем его
      if (wsRef.current) {
        wsRef.current.close(1000, "Переподключение")
        wsRef.current = null
      }

      connect()
    } else {
      // Если токена нет, закрываем соединение
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Токен отсутствует")
        wsRef.current = null
      }
      setStatus("disconnected")
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close(1000, "Токен изменен")
        wsRef.current = null
      }
    }
  }, [token, autoConnect, connect, setStatus])

  return {
    status,
    connect,
    disconnect,
    sendMessage,
    isConnected: status === "connected",
  }
}

