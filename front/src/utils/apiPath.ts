export const REGISTER_ENDPOINT = "/v1/auth/register"
export const LOGIN_ENDPOINT = "/v1/auth/login"
export const PAIR_TOKEN_ENDPOINT = "/v1/pair-token/"
export const VIDEO_UPLOAD_ENDPOINT = "/v1/videos"
export const VIDEO_BY_ID_ENDPOINT = "/v1/videos/{id}"
export const PHOTO_UPLOAD_ENDPOINT = "/v1/photos"
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
export const NEURO_ASSISTANT_CHAT =
  import.meta.env.VITE_NEURO_ASSISTANT_URL || "http://localhost:8090/chat"