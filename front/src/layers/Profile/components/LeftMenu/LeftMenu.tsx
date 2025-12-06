import { Link, useLocation } from "react-router-dom"
import { User, BarChart3, Settings, History, ScrollText, ChartSpline, Users } from "lucide-react"
import styles from "./LeftMenu.module.scss"

interface MenuItem {
  label: string
  path: string
  icon: React.ReactNode
}

function LeftMenu() {
  const location = useLocation()

  const menuItems: MenuItem[] = [
    {
      label: "Профиль",
      path: "/profile",
      icon: <User size={20} />,
    },
    {
      label: "Анализ",
      path: "/profile/analysis",
      icon: <BarChart3 size={20} />,
    },
    {
      label: "Графики",
      path: "/profile/graphics",
      icon: <ChartSpline size={20} />,
    },
    {
      label: "Отчеты",
      path: "/profile/report",
      icon: <ScrollText size={20} />,
    },
    {
      label: "История",
      path: "/profile/history",
      icon: <History size={20} />,
    },
    {
      label: "Настройки",
      path: "/profile/settings",
      icon: <Settings size={20} />,
    },
    {
      label: "Группы",
      path: "/profile/groups",
      icon: <Users size={20} />,
    }
  ]

  return (
    <div className={styles.leftMenu}>
      <nav>
        <ul className={styles.menuList}>
          {menuItems.map((item, index) => (
            <li key={index} className={styles.menuItem}>
              <Link
                to={item.path}
                className={
                  location.pathname === item.path
                    ? `${styles.link} ${styles.active}`
                    : styles.link
                }
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default LeftMenu
