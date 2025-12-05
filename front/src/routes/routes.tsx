import ChatMessagerComponent from "../core/components/ChatMessagerComponent/ChatMessagerComponent"
import VideoPlayer from "../core/components/VideoPlayer/VideoPlayer"
import AuthPage from "../layers/auth/AuthPage"
import MainPage from "../layers/mainPage/MainPage"
import Profile from "../layers/Profile/Pages/Profile"
import History from "../layers/Profile/Pages/History/History"
import HistoryDetailed from "../layers/Profile/Pages/History/HistoryDetailed/HistoryDetailed"
import Report from "../layers/Profile/Pages/Report/Report"
import ReportDetailed from "../layers/Profile/Pages/Report/ReportDetailed/ReportDetailed"
import ProfileMain from "../layers/Profile/Pages/ProfileMain/ProfileMain"
import Analysis from "../layers/Profile/Pages/Analysis/Analysis"
import Settings from "../layers/Profile/Pages/Settings/Settings"

export const routes = [
  { path: "/", element: <MainPage /> },
  { path: "video", element: <VideoPlayer /> },
  { path: "chat", element: <ChatMessagerComponent /> },
  { path: "authorization", element: <AuthPage /> },

  {
    path: "profile",
    element: <Profile />,
    children: [
      { index: true, element: <ProfileMain /> },
      { path: "analysis", element: <Analysis /> },
      { path: "settings", element: <Settings /> },
      { path: "history", element: <History /> },
      { path: "history/:id", element: <HistoryDetailed /> },
      { path: "report", element: <Report /> },
      { path: "report/:id", element: <ReportDetailed /> },
    ],
  },
]
