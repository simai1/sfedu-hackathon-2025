import { useEffect, useState } from "react"
import styles from "./Employees.module.scss"
import { getOrganizationMembers } from "../../../../api/organization"
import { Role, useUserStore } from "../../../../store/userStore"

interface Member {
  id: string
  name: string
  email: string
  joined_at?: string
}

function Employees() {
  const { user } = useUserStore()
  const isOrganization = user?.role === Role.ORGANIZATION
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!isOrganization) return
      try {
        setIsLoading(true)
        setError(null)
        const data = await getOrganizationMembers()
        setMembers(data || [])
      } catch (e: any) {
        setError(e?.message || "Не удалось загрузить сотрудников")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isOrganization])

  if (!isOrganization) {
    return (
      <div className={styles.container}>
        <div className={styles.restricted}>
          <h2>Доступ ограничен</h2>
          <p>Список сотрудников доступен только для организаций.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Сотрудники организации</h1>
          <p className={styles.subtitle}>Список пользователей, привязанных к вашей организации</p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={async () => {
            try {
              setIsLoading(true)
              setError(null)
              const data = await getOrganizationMembers()
              setMembers(data || [])
            } catch (e: any) {
              setError(e?.message || "Не удалось обновить список")
            } finally {
              setIsLoading(false)
            }
          }}
        >
          Обновить
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {isLoading ? (
        <p className={styles.loading}>Загрузка...</p>
      ) : members.length === 0 ? (
        <p className={styles.empty}>Пока нет сотрудников</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Дата привязки</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.joined_at ? new Date(m.joined_at).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Employees

