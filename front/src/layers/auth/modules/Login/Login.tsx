import { useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./Login.module.scss"
import { loginEndpoint } from "../../../../api/login"
import { useUserStore } from "../../../../store/userStore"
import { toast } from "react-toastify"

interface LoginProps {
  onSwitchToRegister: () => void
}

const Login = ({ onSwitchToRegister }: LoginProps) => {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { setToken, setUser } = useUserStore()

  // Функции для сброса ошибок при вводе
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: "" }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: "" }))
    }
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      username: "",
      password: "",
    }

    if (!username.trim()) {
      newErrors.username = "Введите имя пользователя"
      isValid = false
    }

    if (!password) {
      newErrors.password = "Введите пароль"
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов"
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
        const response = await loginEndpoint({ username, password })
        console.log("Login response:", response)

        // Set token and user data in the store (persist middleware автоматически сохранит в localStorage)
        setToken(response.token)
        setUser({
          id: response.id,
          name: response.name,
          email: response.email,
        })

        // Clear form and errors
        setUsername("")
        setPassword("")
        setErrors({
          username: "",
          password: "",
        })

        // Редирект в профиль
        toast.success("Успешный вход!")
        navigate("/profile")
      } catch (error: any) {
        console.error("Login error:", error)
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Неверное имя пользователя или пароль"

        // Показываем ошибку только в тосте, так как не знаем точно, какое поле неверно
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Вход</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              className={`${styles.input} ${
                errors.username ? styles.error : ""
              }`}
              placeholder="Введите имя пользователя"
            />
            {errors.username && (
              <span className={styles.errorMessage}>{errors.username}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
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

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Вход..." : "Войти"}
          </button>
        </form>

        <div className={styles.switchText}>
          Нет аккаунта?{" "}
          <button onClick={onSwitchToRegister} className={styles.switchButton}>
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
