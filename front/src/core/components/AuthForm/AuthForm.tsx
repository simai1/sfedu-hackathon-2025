import React, { useState } from "react"
import styled from "styled-components"
import { motion, AnimatePresence } from "framer-motion"
import Login from "../../../layers/auth/modules/Login/Login"
import Register from "../../../layers/auth/modules/Register/Register"

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true)

  const switchToRegister = () => {
    setIsLogin(false)
  }

  const switchToLogin = () => {
    setIsLogin(true)
  }

  return (
    <StyledWrapper>
      <div className="auth-container">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              <Login onSwitchToRegister={switchToRegister} />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <Register onSwitchToLogin={switchToLogin} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: rgba(17, 24, 39, 1);
  }
`

export default AuthForm
