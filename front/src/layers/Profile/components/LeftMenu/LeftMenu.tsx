import { Link, useLocation } from "react-router-dom"
import { User, BarChart3, Settings, History, ScrollText, ChartSpline, Users, MessageCircle, Play, Music, Video } from "lucide-react"
import styles from "./LeftMenu.module.scss"
import { Role, useUserStore } from "../../../../store/userStore"

interface MenuItem {
  label: string
  path: string
  icon: React.ReactNode
  onlyForOrganization?: boolean
  onlyIfLinkedToOrg?: boolean
  onlyForUser?: boolean
}

function LeftMenu() {
  const location = useLocation()
  const { user } = useUserStore()
  const isOrganization = user?.role === Role.ORGANIZATION
  const isLinkedToOrg = Boolean(user?.organizationCode)
  const isUserRole = user?.role === Role.USER
  
  const menuItems: MenuItem[] = [
    {
      label: "Профиль",
      path: "/profile",
      icon: <User size={20} />,
    },
    {
      label: "Нейро помощник",
      path: "/profile/assistant",
      icon: <MessageCircle size={20} />,
    },
    {
      label: "Группы",
      path: "/profile/groups",
      icon: <Users size={20} />,
      onlyForOrganization: true,
    },
    {
      label: "Мои группы",
      path: "/profile/my-groups",
      icon: <Play size={20} />,
      onlyForOrganization: false,
      onlyIfLinkedToOrg: true,
      onlyForUser: true,
    },
    {
      label: "Сотрудники",
      path: "/profile/employees",
      icon: <User size={20} />,
      onlyForOrganization: true,
    },
    {
      label: "Анализ видео",
      path: "/profile/analysis",
      icon: <Video size={20} />,
    },
    {
      label: "Анализ аудио",
      path: "/profile/audio-analysis",
      icon: <Music size={20} />,
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
  ];

  const filteredItems = menuItems.filter((item) => {
    if (item.onlyForOrganization && !isOrganization) return false
    if (item.onlyForUser && !isUserRole) return false
    if ((item as any).onlyIfLinkedToOrg && !isLinkedToOrg) return false
    return true
  })

  return (
    <div className={styles.leftMenu}>
      <nav>
        <ul className={styles.menuList}>
          {filteredItems.map((item) => (
            <li key={item.path} className={styles.menuItem}>
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
  );
}

export default LeftMenu;
