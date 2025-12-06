import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useThemeStore } from "../../../../store/themeStore"
import { useUserStore } from "../../../../store/userStore"
import styles from "./Settings.module.scss"

function Settings() {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const { clearUser } = useUserStore()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleToggle = (setting: "darkMode") => {
    if (setting === "darkMode") {
      toggleTheme()
    }
  }

  const handleLogout = () => {
    clearUser()
    navigate("/authorization")
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Очищаем ошибку при вводе
    if (passwordErrors[field as keyof typeof passwordErrors]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const validatePasswordForm = () => {
    const errors = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
    let isValid = true

    if (!passwordData.oldPassword.trim()) {
      errors.oldPassword = "Введите старый пароль"
      isValid = false
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = "Введите новый пароль"
      isValid = false
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "Пароль должен быть не менее 6 символов"
      isValid = false
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = "Подтвердите новый пароль"
      isValid = false
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Пароли не совпадают"
      isValid = false
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      errors.newPassword = "Новый пароль должен отличаться от старого"
      isValid = false
    }

    setPasswordErrors(errors)
    return isValid
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePasswordForm()) {
      return
    }

    setIsChangingPassword(true)

    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.1) {
            reject(new Error("Неверный старый пароль"))
          } else {
            resolve(true)
          }
        }, 1000)
      })

      toast.success("Пароль успешно изменен!")
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setPasswordErrors({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setShowPasswordForm(false)
    } catch (error: any) {
      const errorMessage = error?.message || "Ошибка при смене пароля"
      toast.error(errorMessage)
      setPasswordErrors((prev) => ({
        ...prev,
        oldPassword: errorMessage,
      }))
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className={styles.settings}>
      <h1>Настройки</h1>
      <div className={styles.settingsForm}>
        <div className={styles.settingItem}>
          <label>Темная тема</label>
          <div
            className={`${styles.toggle} ${
              isDarkMode ? styles.active : ""
            }`}
            onClick={() => handleToggle("darkMode")}
          >
            <div className={styles.toggleSlider}></div>
          </div>
        </div>

        {!showPasswordForm ? (
          <button
            className={styles.changePasswordButton}
            onClick={() => setShowPasswordForm(true)}
          >
            Сменить пароль
          </button>
        ) : (
          <div className={styles.passwordForm}>
            <div className={styles.passwordFormHeader}>
              <h2>Смена пароля</h2>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowPasswordForm(false)
                  setPasswordData({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  })
                  setPasswordErrors({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  })
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="oldPassword">Старый пароль</label>
                <input
                  id="oldPassword"
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => handlePasswordChange("oldPassword", e.target.value)}
                  className={passwordErrors.oldPassword ? styles.inputError : ""}
                  placeholder="Введите старый пароль"
                />
                {passwordErrors.oldPassword && (
                  <span className={styles.errorText}>{passwordErrors.oldPassword}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newPassword">Новый пароль</label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                  className={passwordErrors.newPassword ? styles.inputError : ""}
                  placeholder="Введите новый пароль"
                />
                {passwordErrors.newPassword && (
                  <span className={styles.errorText}>{passwordErrors.newPassword}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Подтвердите новый пароль</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  className={passwordErrors.confirmPassword ? styles.inputError : ""}
                  placeholder="Повторите новый пароль"
                />
                {passwordErrors.confirmPassword && (
                  <span className={styles.errorText}>{passwordErrors.confirmPassword}</span>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordData({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    })
                    setPasswordErrors({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    })
                  }}
                  disabled={isChangingPassword}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        )}

        <button className={styles.logoutButton} onClick={handleLogout}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}

export default Settings
