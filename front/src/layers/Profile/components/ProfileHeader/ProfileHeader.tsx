import { useState } from "react"
import { Copy, Wifi, WifiOff } from "lucide-react"
import styles from "./ProfileHeader.module.scss"
import { User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../../../store/userStore"
import { usePairToken } from "../../../../hooks/usePairToken"

function ProfileHeader() {
  const [copied, setCopied] = useState(false)
  const isConnected = true // В реальном приложении это будет состояние подключения

  const { user } = useUserStore()
  // Используем React Query для получения токена (автоматически обновится при изменении)
  const { data: apiToken = "" } = usePairToken()

  const handleCopyToken = () => {
    if (apiToken) {
      navigator.clipboard.writeText(apiToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const navigate = useNavigate()

  return (
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
            className={`${styles.statusIndicator} ${
              isConnected ? styles.connected : styles.disconnected
            }`}
          >
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
          </div>
          <span className={styles.statusText}>
            {isConnected ? "Подключен к BrainBit" : "Не подключен"}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
