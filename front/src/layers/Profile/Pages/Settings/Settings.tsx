import { useState } from "react"
import styles from "./Settings.module.scss"

function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    emailUpdates: false,
  })

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }))
  }

  return (
    <div className={styles.settings}>
      <h1>Настройки</h1>
      <div className={styles.settingsForm}>
        <div className={styles.settingItem}>
          <label>Уведомления</label>
          <div
            className={`${styles.toggle} ${
              settings.notifications ? styles.active : ""
            }`}
            onClick={() => handleToggle("notifications")}
          >
            <div className={styles.toggleSlider}></div>
          </div>
        </div>

        <div className={styles.settingItem}>
          <label>Темная тема</label>
          <div
            className={`${styles.toggle} ${
              settings.darkMode ? styles.active : ""
            }`}
            onClick={() => handleToggle("darkMode")}
          >
            <div className={styles.toggleSlider}></div>
          </div>
        </div>

        <div className={styles.settingItem}>
          <label>Email обновления</label>
          <div
            className={`${styles.toggle} ${
              settings.emailUpdates ? styles.active : ""
            }`}
            onClick={() => handleToggle("emailUpdates")}
          >
            <div className={styles.toggleSlider}></div>
          </div>
        </div>

        <button className={styles.saveButton}>Сохранить настройки</button>
      </div>
    </div>
  )
}

export default Settings
