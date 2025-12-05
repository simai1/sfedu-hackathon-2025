import ChatMessagerComponent from "../core/components/ChatMessagerComponent/ChatMessagerComponent"
import VideoPlayer from "../core/components/VideoPlayer/VideoPlayer"
import AuthPage from "../layers/auth/AuthPage"
import MainPage from "../layers/mainPage/MainPage"

export const routes = [
  { path: "/", element: <MainPage /> },
  { path: "video", element: <VideoPlayer /> },
  { path: "chat", element: <ChatMessagerComponent /> },
  { path: "authorization", element: <AuthPage /> },
]
