import { useState } from "react"
import { Copy, Wifi, WifiOff, Loader2, HelpCircle } from "lucide-react"
import styles from "./ProfileHeader.module.scss"
import { User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../../../store/userStore"
import { usePairToken } from "../../../../hooks/usePairToken"
import { useWebSocketStore } from "../../../../store/websocketStore"
import HelpModal from "../../../../core/components/HelpModal/HelpModal"

function ProfileHeader() {
  const [copied, setCopied] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const { user } = useUserStore()
  const { data: apiToken = "" } = usePairToken()
  const { status: wsStatus } = useWebSocketStore()

  const handleCopyToken = () => {
    if (apiToken) {
      navigator.clipboard.writeText(apiToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const navigate = useNavigate()

  const getStatusText = () => {
    switch (wsStatus) {
      case "connected":
        return "Подключен к BrainBit"
      case "connecting":
        return "Подключение к BrainBit..."
      case "disconnected":
        return "Не подключен к BrainBit"
      case "error":
        return "Ошибка подключения"
      default:
        return "Не подключен к BrainBit"
    }
  }

  const getStatusIcon = () => {
    switch (wsStatus) {
      case "connected":
        return <Wifi size={16} />
      case "connecting":
        return <Loader2 size={16} className={styles.spinning} />
      case "disconnected":
        return <WifiOff size={16} />
      case "error":
        return <WifiOff size={16} />
      default:
        return <WifiOff size={16} />
    }
  }

  return (
    <>
      <div className={styles.profileHeader}>
        <div
          className={styles.userInfo}
          onClick={() => {
            navigate("/profile")
          }}
        >
          <div className={styles.avatar}>
            <User size={40} />
          </div>
          <div className={styles.userDetails}>
            <h3 className={styles.userName}>{user?.name || "Пользователь"}</h3>
            <p className={styles.userEmail}>{user?.email || ""}</p>
          </div>
        </div>

        <div className={styles.connectionInfo}>
          <div className={styles.tokenContainer}>
            <span className={styles.tokenLabel}>API Токен:</span>
            <div className={styles.tokenField}>
              <span className={styles.tokenValue}>
                {apiToken ? `${apiToken.substring(0, 12)}...` : "Нет токена"}
              </span>
              <button
                className={styles.copyButton}
                onClick={handleCopyToken}
                title="Скопировать токен"
              >
                {copied ? "✓" : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className={styles.connectionStatus}>
            <div
              className={`${styles.statusIndicator} ${styles[wsStatus]}`}
            >
              {getStatusIcon()}
            </div>
            <span className={styles.statusText}>{getStatusText()}</span>
          </div>

          <button
            className={styles.helpButton}
            onClick={() => setIsHelpModalOpen(true)}
            title="Инструкция по использованию"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  )
}

export default ProfileHeader
