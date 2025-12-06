import { LOGIN_ENDPOINT, REGISTER_ENDPOINT } from "../utils/apiPath"
import { apiRequest } from "./api"

//! получение аксес через refresh token
export const loginEndpoint = async (data: any) => {
  try {
    // Преобразуем username в email для совместимости с бэкендом
    const requestData = {
      email: data.username || data.email,
      password: data.password,
    }
    const response = await apiRequest("post", LOGIN_ENDPOINT, requestData)
    return response.data
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

export const registerEndpoint = async (data: {
  name: string
  email: string
  password: string
  role: string
}) => {
  try {
    const response = await apiRequest("post", REGISTER_ENDPOINT, data)
    return response.data
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}
