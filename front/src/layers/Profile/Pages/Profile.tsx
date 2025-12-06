import { Outlet } from "react-router-dom"
import { useThemeStore } from "../../../store/themeStore"
import LeftMenu from "../components/LeftMenu/LeftMenu"
import ProfileHeader from "../components/ProfileHeader/ProfileHeader"
import styles from "./Profile.module.scss"

function Profile() {
  const { isDarkMode } = useThemeStore()

  return (
    <div 
      className={styles.Profile}
      data-theme={isDarkMode ? "dark" : "light"}
    >
      <ProfileHeader />

      <div className={styles.content}>
        <LeftMenu />
        <div className={styles.mainContent}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Profile
