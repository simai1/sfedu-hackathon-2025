import { useWebSocket } from "../../../hooks/useWebSocket"

function WebSocketManager() {
  useWebSocket({
    autoConnect: true,
    onMessage: (message) => {
      console.log("Получено сообщение от WebSocket:", message)
    },
    onConnect: () => {
      console.log("WebSocket подключен успешно")
    },
    onDisconnect: () => {
      console.log("WebSocket отключен")
    },
    onError: (error) => {
      console.error("Ошибка WebSocket:", error)
    },
  })

  return null
}

export default WebSocketManager

