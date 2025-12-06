import { create } from "zustand"

type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error"

interface WebSocketStore {
  status: WebSocketStatus
  lastMessage: any | null
  setStatus: (status: WebSocketStatus) => void
  setLastMessage: (message: any) => void
}

export const useWebSocketStore = create<WebSocketStore>((set) => ({
  status: "disconnected",
  lastMessage: null,
  setStatus: (status) => set({ status }),
  setLastMessage: (message) => set({ lastMessage: message }),
}))

