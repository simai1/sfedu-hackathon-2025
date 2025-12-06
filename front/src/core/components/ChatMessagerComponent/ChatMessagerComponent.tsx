import React, { useState, useRef, useEffect } from "react"
import styles from "./ChatMessagerComponent.module.scss"
import { NEURO_ASSISTANT_CHAT } from "../../../utils/apiPath"
import { useChatAssistantStore, type ChatMessage } from "../../../store/chatAssistantStore"

function ChatMessagerComponent() {
  const { messages, addMessage } = useChatAssistantStore()
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Функция для прокрутки к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Прокручиваем к последнему сообщению при изменении сообщений
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Функция для получения времени в формате ЧЧ:ММ
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")

  const formatMarkdown = (text: string) => {
    const escaped = escapeHtml(text)
    const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    return withBold.replace(/\n/g, "<br/>")
  }

  const buildPayload = (history: ChatMessage[], userText: string) => {
    const mapped = history.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }))
    return {
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for video editing tips and BrainBit users. Answer concisely.",
        },
        ...mapped,
        { role: "user", content: userText },
      ],
      stream: false,
      temperature: 0.7,
    }
  }

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date().toISOString(),
    }

    addMessage(userMessage)
    setInputValue("")
    setIsLoading(true)
    setError(null)

    try {
      const payload = buildPayload(messages, userMessage.text)
      const res = await fetch(NEURO_ASSISTANT_CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(`Ошибка ответа: ${res.status}`)
      }
      const data = await res.json()
      const botText =
        data?.choices?.[0]?.message?.content ||
        data?.message ||
        "Извините, не удалось получить ответ."

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: "bot",
        timestamp: new Date().toISOString(),
      }

      addMessage(botMessage)
    } catch (err: any) {
      setError(err?.message || "Не удалось получить ответ")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={styles.ChatMessagerComponent}>
      <div className={styles.chatHeader}>Чат с ассистентом</div>

      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${
              message.sender === "user" ? styles.userMessage : styles.botMessage
            }`}
          >
            <div
              className={styles.messageText}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(message.text) }}
            />
            <div className={styles.messageTime}>
              {formatTime(new Date(message.timestamp))}
            </div>
          </div>
        ))}

        {error && <div className={styles.error}>{error}</div>}

        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingMessage}>
              <div className={styles.loaderWrapper}>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <input
          type="text"
          className={styles.messageInput}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите ваше сообщение..."
          disabled={isLoading}
        />
        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={isLoading || inputValue.trim() === ""}
        >
          Отправить
        </button>
      </div>
    </div>
  )
}

export default ChatMessagerComponent
