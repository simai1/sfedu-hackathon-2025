import { Outlet } from "react-router-dom"
import LeftMenu from "../components/LeftMenu/LeftMenu"
import ProfileHeader from "../components/ProfileHeader/ProfileHeader"
import styles from "./Profile.module.scss"

function Profile() {
  return (
    <div className={styles.Profile}>
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
