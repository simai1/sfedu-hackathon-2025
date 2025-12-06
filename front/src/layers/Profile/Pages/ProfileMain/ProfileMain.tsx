import { useState, useEffect } from "react"
import { Edit, Save, X, Copy, RefreshCw, Eye, EyeOff } from "lucide-react"
import styles from "./ProfileMain.module.scss"
import { useUserStore } from "../../../../store/userStore"
import { usePairToken, useGeneratePairToken } from "../../../../hooks/usePairToken"
import SubscriptionPlans from "../../components/SubscriptionPlans/SubscriptionPlans"

function ProfileMain() {
  const { user, setUser } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    registrationDate: "01.01.2023",
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        registrationDate: "01.01.2023",
      })
    }
  }, [user])

  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)

  const {
    data: apiToken = "",
    isLoading: isLoadingToken,
    error: tokenError,
  } = usePairToken()

  const generateTokenMutation = useGeneratePairToken()

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = () => {
    console.log("Saving profile data:", profileData)
    if (user) {
      setUser({
        ...user,
        name: profileData.name,
        email: profileData.email,
      })
    }
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
    setCopied(false)
    generateTokenMutation.mutate()
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

      <div className={styles.apiTokenContainer}>
        <h2>API Токен</h2>
        <p className={styles.tokenDescription}>
          Используйте этот токен для аутентификации в desktop приложении .
          Храните его в безопасности и не делитесь с другими.
        </p>

        <div className={styles.tokenField}>
          <input
            type={showToken ? "text" : "password"}
            value={
              isLoadingToken || generateTokenMutation.isPending
                ? "Загрузка..."
                : apiToken
            }
            readOnly
            className={styles.tokenInput}
            disabled={isLoadingToken || generateTokenMutation.isPending}
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

        {(tokenError || generateTokenMutation.isError) && (
          <p className={styles.tokenError} style={{ color: "red", marginTop: "10px" }}>
            {tokenError
              ? "Не удалось загрузить токен"
              : generateTokenMutation.isError
              ? "Не удалось сгенерировать токен"
              : ""}
          </p>
        )}
        <div className={styles.tokenButtons}>
          <button
            className={styles.refreshButton}
            onClick={handleRefreshToken}
            disabled={isLoadingToken || generateTokenMutation.isPending}
          >
            <RefreshCw size={18} />
            {isLoadingToken || generateTokenMutation.isPending
              ? "Обновление..."
              : "Обновить токен"}
          </button>
        </div>
      </div>

      <SubscriptionPlans currentPlan="free" />
    </div>
  )
}

export default ProfileMain
