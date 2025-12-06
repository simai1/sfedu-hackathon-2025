import { useEffect, useState } from "react"
import { Plus, Users } from "lucide-react"
import { useUserStore, Role } from "../../../../store/userStore"
import styles from "./Groups.module.scss"
import CreateGroupModal from "./components/CreateGroupModal/CreateGroupModal"
import GroupCard from "./components/GroupCard/GroupCard"
import { apiCreateGroup, apiListGroups, apiAddGroupMember, apiAddGroupSession } from "../../../../api/groups"
import { getOrganizationMembers } from "../../../../api/organization"
import { toast } from "react-toastify"

export interface GroupMember {
  id: string
  email: string
  name?: string
  joined_at?: string
  watched?: boolean
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
  const [groups, setGroups] = useState<Group[]>([])
  const [orgMembers, setOrgMembers] = useState<GroupMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const isOrganization = user?.role === Role.ORGANIZATION

  const loadData = async () => {
    if (!isOrganization) return
    try {
      setIsLoading(true)
      const [membersResp, groupsResp] = await Promise.all([getOrganizationMembers(), apiListGroups()])
      const mappedGroups: Group[] = (groupsResp || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description || "",
        createdAt: g.created_at || g.createdAt,
        ownerId: user?.id || "",
        members: (g.members || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          joined_at: m.joined_at,
          watched: false,
        })),
        sessions: (g.sessions || []).map((s: any) => ({
          id: s.id,
          videoUrl: s.video_url || s.videoUrl,
          videoName: s.video_name || s.videoName || "Видео",
          createdAt: s.created_at || s.createdAt,
          watchedCount: 0,
          totalMembers: (g.members?.length || 0),
          canAnalyze: false,
        })),
      }))
      setGroups(mappedGroups)
      setOrgMembers(membersResp || [])
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Не удалось загрузить группы")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrganization])

  const handleCreateGroup = async (groupData: { name: string; description: string }) => {
    try {
      await apiCreateGroup({ name: groupData.name, description: groupData.description })
      toast.success("Группа создана")
      setIsCreateModalOpen(false)
      await loadData()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Не удалось создать группу")
    }
  }

  const handleAddMember = async (groupId: string, memberId: string) => {
    try {
      const added = await apiAddGroupMember(groupId, memberId)
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                members: [
                  ...g.members,
                  {
                    id: added.id,
                    name: added.name,
                    email: added.email,
                    joined_at: added.joined_at,
                    watched: false,
                  },
                ],
              }
            : g
        )
      )
      toast.success("Сотрудник добавлен в группу")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Не удалось добавить сотрудника")
    }
  }

  const handleAddSession = async (groupId: string, file: File) => {
    try {
      const session = await apiAddGroupSession(groupId, file)
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                sessions: [
                  ...g.sessions,
                  {
                    id: session.id,
                    videoUrl: session.video_url || session.videoUrl,
                    videoName: session.video_name || session.videoName || file.name,
                    createdAt: session.created_at || session.createdAt,
                    watchedCount: 0,
                    totalMembers: g.members.length,
                    canAnalyze: false,
                  },
                ],
              }
            : g
        )
      )
      toast.success("Видео добавлено в группу")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Не удалось добавить видео")
    }
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

      {isLoading ? (
        <div className={styles.emptyState}>
          <Users size={64} />
          <h2>Загрузка...</h2>
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={64} />
          <h2>Нет групп</h2>
          <p>Создайте первую группу для начала работы</p>
        </div>
      ) : (
        <div className={styles.groupsGrid}>
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              orgMembers={orgMembers}
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
