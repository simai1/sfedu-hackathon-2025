import { useState } from "react"
import Login from "./modules/Login/Login"
import Register from "./modules/Register/Register"
import styles from "./authPage.module.scss"
import { motion, AnimatePresence } from "framer-motion"

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)

  const switchToRegister = () => {
    setIsLogin(false)
  }

  const switchToLogin = () => {
    setIsLogin(true)
  }

  return (
    <div className={styles.authPage}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? "login" : "register"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isLogin ? (
            <Login onSwitchToRegister={switchToRegister} />
          ) : (
            <Register onSwitchToLogin={switchToLogin} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default AuthPage
