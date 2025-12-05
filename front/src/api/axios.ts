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
})

api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data"
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
