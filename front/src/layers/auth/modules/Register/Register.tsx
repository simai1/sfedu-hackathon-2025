import { useState } from "react"
import styles from "./Register.module.scss"

interface RegisterProps {
  onSwitchToLogin: () => void
}

const Register = ({ onSwitchToLogin }: RegisterProps) => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    }

    if (!username.trim()) {
      newErrors.username = "Введите имя пользователя"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // Здесь будет логика отправки данных на сервер
      console.log("Register with:", { username, email, password })
      // Очищаем форму после успешной отправки
      setUsername("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
    }
  }

  return (
    <div className={styles.registerPage}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Регистрация</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="reg-username">Имя пользователя</label>
            <input
              type="text"
              id="reg-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

          <button type="submit" className={styles.submitButton}>
            Зарегистрироваться
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
