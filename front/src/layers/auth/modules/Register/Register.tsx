import { useState } from "react"
import styles from "./Register.module.scss"
import { registerEndpoint } from "../../../../api/login"
import { useUserStore } from "../../../../store/userStore"

interface RegisterProps {
  onSwitchToLogin: () => void
}

const Register = ({ onSwitchToLogin }: RegisterProps) => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { setToken, setUser } = useUserStore()

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
        const response = await registerEndpoint({ name, email, password })
        console.log("Register response:", response)

        // Set token and user data in the store
        setToken(response.token)
        setUser(response.user)

        // Clear form
        setName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
      } catch (error) {
        console.error("Registration error:", error)
        setErrors({
          ...errors,
          email: "Пользователь с таким email уже существует",
        })
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
            <label htmlFor="reg-name">Имя пользователя</label>
            <input
              type="text"
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${styles.input} ${errors.name ? styles.error : ""}`}
              placeholder="Введите имя пользователя"
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
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
