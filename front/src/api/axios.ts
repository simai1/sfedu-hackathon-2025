import axios from "axios";
import { useUserStore } from "store/userStore";
import { useWorkFromOrgStore } from "store/workFromOrganization";

const url = process.env.REACT_APP_API_URL;
const URL = window.location.origin;
const funGetServer = () => {
  if (URL.includes("localhost")) {
    return url;
  } else {
    return `${URL}`;
  }
};

export const server = funGetServer() + "/api";
export const serverStatic = funGetServer() + "/api/static";

const api = axios.create({
  baseURL: server,
  withCredentials: true,
});

// Добавляем interceptor для автоматического подставления токена
api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.request.use(
  (config) => {
    const id = useWorkFromOrgStore.getState().id;
    if (id) {
      config.headers["X-Organization-Id"] = `${id}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
