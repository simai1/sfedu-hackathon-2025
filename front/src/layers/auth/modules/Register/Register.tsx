import { useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./Register.module.scss"
import { registerEndpoint } from "../../../../api/login"
import { useUserStore } from "../../../../store/userStore"
import { toast } from "react-toastify"
import { Role } from "../../../../store/userStore" // Импортируем перечисление Role

interface RegisterProps {
  onSwitchToLogin: () => void
}

const Register = ({ onSwitchToLogin }: RegisterProps) => {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isOrganization, setIsOrganization] = useState(false) // Новое состояние для роли
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { setToken, setUser } = useUserStore()

  // Функции для сброса ошибок при вводе
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }))
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: "" }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: "" }))
    }
    // Также сбрасываем ошибку подтверждения пароля при изменении пароля
    if (errors.confirmPassword && e.target.value === confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }))
    }
  }

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value)
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }))
    }
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    }

    if (!name.trim()) {
      newErrors.name = "Введите имя пользователя"
      isValid = false
    }

    if (!email) {
      newErrors.email = "Введите email"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Введите корректный email"
      isValid = false
    }

    if (!password) {
      newErrors.password = "Введите пароль"
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов"
      isValid = false
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Подтвердите пароль"
      isValid = false
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsLoading(true)
      try {
        // Добавляем роль в данные для регистрации
        const role = isOrganization ? "organization" : "user"
        const response = await registerEndpoint({ name, email, password, role })
        console.log("Register response:", response)

        setToken(response.token)
        setUser({
          id: response.id,
          name: response.name,
          email: response.email,
          role:
            response.role || (isOrganization ? Role.ORGANIZATION : Role.USER), // Добавляем роль в пользовательские данные
        })

        setName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setIsOrganization(false)
        setErrors({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        })

        toast.success("Регистрация успешна!")
        navigate("/profile")
      } catch (error: any) {
        console.error("Registration error:", error)
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Ошибка при регистрации."

        // Определяем, в какое поле показать ошибку на основе содержимого сообщения
        const errorMessageLower = errorMessage.toLowerCase()
        const newErrors = {
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        }

        if (
          errorMessageLower.includes("email") ||
          errorMessageLower.includes("почт")
        ) {
          newErrors.email = errorMessage
        } else if (
          errorMessageLower.includes("password") ||
          errorMessageLower.includes("парол")
        ) {
          newErrors.password = errorMessage
        } else if (
          errorMessageLower.includes("name") ||
          errorMessageLower.includes("имя") ||
          errorMessageLower.includes("фио")
        ) {
          newErrors.name = errorMessage
        }
        // Если ошибка не связана с конкретным полем, показываем только в тосте

        setErrors(newErrors)
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className={styles.registerPage}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Регистрация</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="reg-name">ФИО</label>
            <input
              type="text"
              id="reg-name"
              value={name}
              onChange={handleNameChange}
              className={`${styles.input} ${errors.name ? styles.error : ""}`}
              placeholder="Введите ФИО"
            />
            {errors.name && (
              <span className={styles.errorMessage}>{errors.name}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="reg-email">Email</label>
            <input
              type="email"
              id="reg-email"
              value={email}
              onChange={handleEmailChange}
              className={`${styles.input} ${errors.email ? styles.error : ""}`}
              placeholder="Введите email"
            />
            {errors.email && (
              <span className={styles.errorMessage}>{errors.email}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="reg-password">Пароль</label>
            <input
              type="password"
              id="reg-password"
              value={password}
              onChange={handlePasswordChange}
              className={`${styles.input} ${
                errors.password ? styles.error : ""
              }`}
              placeholder="Введите пароль"
            />
            {errors.password && (
              <span className={styles.errorMessage}>{errors.password}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="reg-confirm-password">Подтверждение пароля</label>
            <input
              type="password"
              id="reg-confirm-password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className={`${styles.input} ${
                errors.confirmPassword ? styles.error : ""
              }`}
              placeholder="Подтвердите пароль"
            />
            {errors.confirmPassword && (
              <span className={styles.errorMessage}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>
              <input
                type="checkbox"
                checked={isOrganization}
                onChange={(e) => setIsOrganization(e.target.checked)}
              />
              Регистрация организации
            </label>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <div className={styles.switchText}>
          Уже есть аккаунт?{" "}
          <button onClick={onSwitchToLogin} className={styles.switchButton}>
            Войти
          </button>
        </div>
      </div>
    </div>
  )
}

export default Register
