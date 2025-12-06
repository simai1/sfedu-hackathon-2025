import React, { useState, useRef, useEffect } from "react"
import styles from "./ChatMessagerComponent.module.scss"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

function ChatMessagerComponent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Привет! Я ваш виртуальный помощник. Задайте мне любой вопрос.",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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

  const generateBotResponse = (userMessage: string): string => {
    const responses = [
      "Понимаю ваш запрос. Это интересный вопрос!",
      "Спасибо за ваше сообщение. Я изучаю его содержание.",
      "Отличный вопрос! Дайте подумать...",
      "Я получил ваше сообщение и обрабатываю информацию.",
      "Интересная точка зрения. Что еще вы хотели бы узнать?",
      "Спасибо за обращение. Я постараюсь помочь вам с этим.",
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }
  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isLoading) return

    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botResponse])
      setIsLoading(false)
    }, 1500)
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
            <div className={styles.messageText}>{message.text}</div>
            <div className={styles.messageTime}>
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}

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
