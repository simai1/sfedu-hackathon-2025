import { useEffect, useState } from "react"
import styles from "./MyGroups.module.scss"
import { apiListMyGroups } from "../../../../api/groups"
import { toast } from "react-toastify"

interface MyGroup {
  id: string
  name: string
  description?: string
  created_at?: string
  members: { id: string; name?: string; email: string }[]
  sessions: {
    id: string
    video_url: string
    video_name?: string
    created_at?: string
  }[]
}

function MyGroups() {
  const [groups, setGroups] = useState<MyGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const data = await apiListMyGroups()
        setGroups(data || [])
      } catch (e: any) {
        toast.error(e?.response?.data?.message || e?.message || "Не удалось загрузить группы")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className={styles.container}>
      <h1>Мои группы</h1>
      {isLoading ? (
        <p className={styles.status}>Загрузка...</p>
      ) : groups.length === 0 ? (
        <p className={styles.status}>Вы пока не привязаны к группам</p>
      ) : (
        <div className={styles.groupsList}>
          {groups.map((g) => (
            <div key={g.id} className={styles.groupCard}>
              <div className={styles.header}>
                <div>
                  <h3>{g.name}</h3>
                  {g.description && <p className={styles.desc}>{g.description}</p>}
                </div>
              </div>
              <div className={styles.sessions}>
                <h4>Сессия</h4>
                {g.sessions.length === 0 ? (
                  <p className={styles.status}>Пока нет видео</p>
                ) : (
                  g.sessions.map((s) => (
                    <div key={s.id} className={styles.sessionItem}>
                      <div className={styles.sessionInfo}>
                        <span className={styles.sessionName}>{s.video_name || "Видео"}</span>
                        <span className={styles.sessionDate}>
                          {s.created_at ? new Date(s.created_at).toLocaleString() : ""}
                        </span>
                      </div>
                      <a className={styles.watchButton} href={s.video_url} target="_blank" rel="noreferrer">
                        Смотреть
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyGroups

