import { useState } from "react"
import { Plus, Users } from "lucide-react"
import { useUserStore, Role } from "../../../../store/userStore"
import styles from "./Groups.module.scss"
import CreateGroupModal from "./components/CreateGroupModal/CreateGroupModal"
import GroupCard from "./components/GroupCard/GroupCard"

export interface GroupMember {
  id: string
  email: string
  name?: string
  watched: boolean
  watchedAt?: string
}

export interface GroupSession {
  id: string
  videoUrl: string
  videoName: string
  createdAt: string
  watchedCount: number
  totalMembers: number
  canAnalyze: boolean
}

export interface Group {
  id: string
  name: string
  description: string
  createdAt: string
  members: GroupMember[]
  sessions: GroupSession[]
  ownerId: string
}

function Groups() {
  const { user } = useUserStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([
    {
      id: "1",
      name: "Группа тестирования",
      description: "Тестовая группа для проверки функционала",
      createdAt: "2024-12-01T10:00:00",
      ownerId: user?.id || "1",
      members: [
        { id: "1", email: "user1@example.com", name: "Иван Иванов", watched: true, watchedAt: "2024-12-05T14:30:00" },
        { id: "2", email: "user2@example.com", name: "Мария Петрова", watched: true, watchedAt: "2024-12-05T15:00:00" },
        { id: "3", email: "user3@example.com", name: "Петр Сидоров", watched: false },
      ],
      sessions: [
        {
          id: "1",
          videoUrl: "https://example.com/video.mp4",
          videoName: "Презентация проекта",
          createdAt: "2024-12-05T10:00:00",
          watchedCount: 2,
          totalMembers: 3,
          canAnalyze: false,
        },
      ],
    },
  ])

  const isOrganization = user?.role === Role.ORGANIZATION

  const handleCreateGroup = (groupData: { name: string; description: string }) => {
    const newGroup: Group = {
      id: Date.now().toString(),
      name: groupData.name,
      description: groupData.description,
      createdAt: new Date().toISOString(),
      ownerId: user?.id || "1",
      members: [],
      sessions: [],
    }
    setGroups([...groups, newGroup])
    setIsCreateModalOpen(false)
  }

  const handleAddMember = (groupId: string, email: string) => {
    setGroups(
      groups.map((group) => {
        if (group.id === groupId) {
          const newMember: GroupMember = {
            id: Date.now().toString(),
            email,
            watched: false,
          }
          return {
            ...group,
            members: [...group.members, newMember],
          }
        }
        return group
      })
    )
  }

  const handleAddSession = (groupId: string, videoFile: File) => {
    const group = groups.find((g) => g.id === groupId)
    if (!group) return

    const videoUrl = URL.createObjectURL(videoFile)
    const totalMembers = group.members.length
    const newSession: GroupSession = {
      id: Date.now().toString(),
      videoUrl,
      videoName: videoFile.name,
      createdAt: new Date().toISOString(),
      watchedCount: 0,
      totalMembers,
      canAnalyze: false,
    }
    setGroups(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            sessions: [...g.sessions, newSession],
          }
        }
        return g
      })
    )
  }

  const handleAnalyze = (groupId: string, sessionId: string) => {
    console.log("Запуск комплексного анализа для группы:", groupId, "сессии:", sessionId)
  }

//   if (!isOrganization) {
//     return (
//       <div className={styles.groupsContainer}>
//         <div className={styles.emptyState}>
//           <Users size={64} />
//           <h2>Доступ ограничен</h2>
//           <p>Функция создания групп доступна только для организаций</p>
//         </div>
//       </div>
//     )
//   }

  return (
    <div className={styles.groupsContainer}>
      <div className={styles.header}>
        <div>
          <h1>Группы</h1>
          <p className={styles.subtitle}>Управление группами пользователей и сессиями анализа</p>
        </div>
        <button className={styles.createButton} onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={20} />
          Создать группу
        </button>
      </div>

      {groups.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={64} />
          <h2>Нет групп</h2>
          <p>Создайте первую группу для начала работы</p>
          <button className={styles.createButton} onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={20} />
            Создать группу
          </button>
        </div>
      ) : (
        <div className={styles.groupsGrid}>
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onAddMember={handleAddMember}
              onAddSession={handleAddSession}
              onAnalyze={handleAnalyze}
            />
          ))}
        </div>
      )}

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGroup}
      />
    </div>
  )
}

export default Groups
