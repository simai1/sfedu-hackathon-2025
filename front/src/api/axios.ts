import axios from "axios"
import { useUserStore } from "../store/userStore"

// Use a simpler approach for determining the server URL
const getServerUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || "http://localhost:3001"
  } else {
    return window.location.origin
  }
}

export const server = getServerUrl()
export const serverStatic = getServerUrl() + "/static"

const api = axios.create({
  baseURL: server,
  withCredentials: true,
  maxRedirects: 5, // Разрешаем следовать редиректам
  validateStatus: (status) => {
    // Разрешаем обработку статусов 200-399 (включая редиректы)
    return status >= 200 && status < 400
  },
})

api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Axios автоматически установит Content-Type: application/json для обычных объектов
    return config
  },
  (error) => Promise.reject(error)
)

export default api
