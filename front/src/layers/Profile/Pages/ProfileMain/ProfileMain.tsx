import { useState } from "react"
import { Edit, Save, X, Copy, RefreshCw, Eye, EyeOff } from "lucide-react"
import styles from "./ProfileMain.module.scss"

function ProfileMain() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "Иван Иванов",
    email: "ivan@example.com",
    registrationDate: "01.01.2023",
  })

  const [apiToken, setApiToken] = useState(
    "sk-abcdefgh-ijklmnop-qrstuvwx-yz123456"
  )
  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = () => {
    // Здесь будет логика сохранения данных
    console.log("Saving profile data:", profileData)
    setIsEditing(false)
  }

  const handleChange = (field: keyof typeof profileData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefreshToken = () => {
    // Генерируем новый токен (в реальном приложении это будет API вызов)
    const newToken =
      "sk-" +
      Math.random().toString(36).substring(2, 15) +
      "-" +
      Math.random().toString(36).substring(2, 15)
    setApiToken(newToken)
    setCopied(false)
  }

  const toggleTokenVisibility = () => {
    setShowToken(!showToken)
  }

  return (
    <div className={styles.profileMain}>
      <div className={styles.header}>
        <h1>Профиль пользователя</h1>
        {!isEditing ? (
          <button className={styles.editButton} onClick={handleEdit}>
            <Edit size={18} />
            Редактировать
          </button>
        ) : (
          <div className={styles.actionButtons}>
            <button className={styles.saveButton} onClick={handleSave}>
              <Save size={18} />
              Сохранить
            </button>
            <button className={styles.cancelButton} onClick={handleCancel}>
              <X size={18} />
              Отмена
            </button>
          </div>
        )}
      </div>

      <div className={styles.profileInfo}>
        <div className={styles.infoItem}>
          <label>Имя:</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={styles.editInput}
            />
          ) : (
            <span>{profileData.name}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <label>Email:</label>
          {isEditing ? (
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={styles.editInput}
            />
          ) : (
            <span>{profileData.email}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <label>Дата регистрации:</label>
          <span>{profileData.registrationDate}</span>
        </div>
      </div>

      {/* API Token Container */}
      <div className={styles.apiTokenContainer}>
        <h2>API Токен</h2>
        <p className={styles.tokenDescription}>
          Используйте этот токен для аутентификации в desktop приложении .
          Храните его в безопасности и не делитесь с другими.
        </p>

        <div className={styles.tokenField}>
          <input
            type={showToken ? "text" : "password"}
            value={apiToken}
            readOnly
            className={styles.tokenInput}
          />
          <div className={styles.tokenActions}>
            <button
              className={styles.tokenButton}
              onClick={toggleTokenVisibility}
              title={showToken ? "Скрыть токен" : "Показать токен"}
            >
              {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              className={styles.tokenButton}
              onClick={handleCopyToken}
              title="Скопировать токен"
            >
              {copied ? "✓" : <Copy size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.tokenButtons}>
          <button className={styles.refreshButton} onClick={handleRefreshToken}>
            <RefreshCw size={18} />
            Обновить токен
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileMain
