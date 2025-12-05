import { useState } from "react"
import styles from "./Login.module.scss"

interface LoginProps {
  onSwitchToRegister: () => void
}

const Login = ({ onSwitchToRegister }: LoginProps) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  })

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // Здесь будет логика отправки данных на сервер
      console.log("Login with:", { username, password })
      // Очищаем форму после успешной отправки
      setUsername("")
      setPassword("")
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
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
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

          <button type="submit" className={styles.submitButton}>
            Войти
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
