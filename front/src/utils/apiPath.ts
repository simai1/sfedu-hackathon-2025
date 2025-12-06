export const REGISTER_ENDPOINT = "/v1/auth/register"
export const LOGIN_ENDPOINT = "/v1/auth/login"
export const PAIR_TOKEN_ENDPOINT = "/v1/pair-token/"

// WebSocket endpoint
const getWebSocketUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_WS_URL || "ws://localhost:3000"
  } else {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    return `${protocol}//${window.location.host}`
  }
}

export const WEBSOCKET_BASE_URL = getWebSocketUrl()
export const WEBSOCKET_CLIENT_ENDPOINT = "/ws/client"