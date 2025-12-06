import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ChatSender = "user" | "bot"

export interface ChatMessage {
  id: string
  text: string
  sender: ChatSender
  timestamp: string // ISO string for persistence
}

interface ChatAssistantState {
  messages: ChatMessage[]
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  clear: () => void
}

export const useChatAssistantStore = create<ChatAssistantState>()(
  persist(
    (set, get) => ({
      messages: [
        {
          id: "welcome",
          text: "Привет! Я нейро-помощник по вопросам обработки видео. Спроси, например: «Как осветлить тени в видео?»",
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ],
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => {
        const updated = [...get().messages, message]
        // ограничиваем историю, чтобы не разрасталась
        const max = 50
        const sliced = updated.length > max ? updated.slice(updated.length - max) : updated
        set({ messages: sliced })
      },
      clear: () => set({ messages: [] }),
    }),
    {
      name: "chat-assistant-store",
    }
  )
)

