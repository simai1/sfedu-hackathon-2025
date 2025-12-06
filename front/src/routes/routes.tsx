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
import AudioAnalysis from "../layers/Profile/Pages/AudioAnalysis/AudioAnalysis"
import Settings from "../layers/Profile/Pages/Settings/Settings"
import Graphics from "../layers/Profile/Pages/Graphics/Graphics"
import Groups from "../layers/Profile/Pages/Groups/Groups"
import Assistant from "../layers/Profile/Pages/Assistant/Assistant"
import Employees from "../layers/Profile/Pages/Employees/Employees"
import MyGroups from "../layers/Profile/Pages/MyGroups/MyGroups"

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
      { path: "audio-analysis", element: <AudioAnalysis /> },
      { path: "settings", element: <Settings /> },
      { path: "graphics", element: <Graphics /> },
      { path: "history", element: <History /> },
      { path: "history/:id", element: <HistoryDetailed /> },
      { path: "report", element: <Report /> },
      { path: "report/:id", element: <ReportDetailed /> },
      { path: "groups", element: <Groups /> },
      { path: "my-groups", element: <MyGroups /> },
      { path: "assistant", element: <Assistant /> },
      { path: "employees", element: <Employees /> },
    ],
  },
]
