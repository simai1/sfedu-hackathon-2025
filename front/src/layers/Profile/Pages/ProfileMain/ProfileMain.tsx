import { useState, useEffect } from "react"
import { Edit, Save, X, Copy, RefreshCw, Eye, EyeOff } from "lucide-react"
import styles from "./ProfileMain.module.scss"
import { Role, useUserStore } from "../../../../store/userStore"
import { usePairToken, useGeneratePairToken } from "../../../../hooks/usePairToken"
import SubscriptionPlans from "../../components/SubscriptionPlans/SubscriptionPlans"

function ProfileMain() {
  const { user, setUser, linkToOrganization } = useUserStore()
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
  const [copiedOrgCode, setCopiedOrgCode] = useState(false)
  const [orgCodeInput, setOrgCodeInput] = useState("")
  const [isLinking, setIsLinking] = useState(false)
  const [orgStatus, setOrgStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })

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

  const isOrganization = user?.role === Role.ORGANIZATION
  const organizationCode = (() => {
    if (user?.organizationCode) return user.organizationCode
    if (isOrganization && user?.id) return `ORG-${user.id.slice(0, 6).toUpperCase()}`
    return ""
  })()

  useEffect(() => {
    if (isOrganization && user && organizationCode && !user.organizationCode) {
      setUser({ ...user, organizationCode })
    }
  }, [isOrganization, organizationCode, setUser, user])

  const handleCopyOrganizationCode = () => {
    if (!organizationCode) return
    navigator.clipboard.writeText(organizationCode)
    setCopiedOrgCode(true)
    setTimeout(() => setCopiedOrgCode(false), 2000)
  }

  const handleLinkOrganization = async () => {
    if (!orgCodeInput.trim()) {
      setOrgStatus({ type: "error", message: "Введите код организации" })
      return
    }

    try {
      setIsLinking(true)
      const result = await linkToOrganization(orgCodeInput.trim())
      setOrgStatus({
        type: "success",
        message: `Успешно привязаны к ${result.organizationName}`,
      })
      setOrgCodeInput("")
    } catch (error) {
      setOrgStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Не удалось привязаться к организации",
      })
    } finally {
      setIsLinking(false)
    }
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

      <div className={styles.organizationContainer}>
        <h2>{isOrganization ? "Код для подключения пользователей" : "Привязка к организации"}</h2>
        <p className={styles.sectionDescription}>
          {isOrganization
            ? "Передайте этот код участникам — после ввода они будут привязаны к вашей организации."
            : "Введите код организации, чтобы присоединиться. Код можно запросить у администратора вашей организации."}
        </p>

        {isOrganization ? (
          <div className={styles.organizationCodeBlock}>
            <div className={styles.codeValue}>{organizationCode || "Код будет доступен после генерации"}</div>
            <button
              className={styles.copyCodeButton}
              onClick={handleCopyOrganizationCode}
              disabled={!organizationCode}
              title="Скопировать код организации"
            >
              {copiedOrgCode ? "✓" : <Copy size={18} />}
            </button>
          </div>
        ) : (
          <>
            {user?.organizationCode && (
              <div className={styles.linkedOrganization}>
                <div className={styles.linkedOrgLabel}>Текущая организация</div>
                <div className={styles.linkedOrgCode}>{user.organizationCode}</div>
                {user.organizationName && <div className={styles.linkedOrgName}>{user.organizationName}</div>}
              </div>
            )}

            <div className={styles.joinForm}>
              <input
                type="text"
                value={orgCodeInput}
                onChange={(e) => setOrgCodeInput(e.target.value)}
                placeholder="Введите код организации"
                className={styles.joinInput}
              />
              <button className={styles.joinButton} onClick={handleLinkOrganization} disabled={isLinking}>
                {isLinking ? "Привязываем..." : "Привязаться"}
              </button>
            </div>

            {orgStatus.type && (
              <div
                className={`${styles.statusMessage} ${
                  orgStatus.type === "success" ? styles.statusSuccess : styles.statusError
                }`}
              >
                {orgStatus.message}
              </div>
            )}
          </>
        )}
      </div>

      <SubscriptionPlans currentPlan="free" />
    </div>
  )
}

export default ProfileMain
