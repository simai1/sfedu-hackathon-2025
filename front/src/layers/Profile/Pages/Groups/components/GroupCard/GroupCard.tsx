import { useState } from "react"
import { Users, Video, Plus, BarChart3, X, CheckCircle, Clock } from "lucide-react"
import { type Group } from "./../../Groups"
import styles from "./GroupCard.module.scss"

interface GroupCardProps {
  group: Group
  orgMembers: { id: string; name?: string; email: string }[]
  onAddMember: (groupId: string, memberId: string) => void
  onAddSession: (groupId: string, videoFile: File) => void
  onAnalyze: (groupId: string, sessionId: string) => void
}

function GroupCard({ group, orgMembers, onAddMember, onAddSession, onAnalyze }: GroupCardProps) {
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [isAddingSession, setIsAddingSession] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return
    onAddMember(group.id, selectedMember)
    setSelectedMember("")
    setIsAddingMember(false)
  }

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFile) {
      onAddSession(group.id, selectedFile)
      setSelectedFile(null)
      setIsAddingSession(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file)
    }
  }

  const watchedCount = group.members.filter((m) => m.watched).length
  const totalMembers = group.members.length

  // Обновляем canAnalyze для сессий
  const updatedSessions = group.sessions.map((session) => ({
    ...session,
    canAnalyze: session.watchedCount === totalMembers && totalMembers > 0,
  }))

  return (
    <div className={styles.groupCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.groupName}>{group.name}</h3>
          <p className={styles.groupDescription}>{group.description}</p>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.membersSection}>
          <div className={styles.sectionHeader}>
            <Users size={18} />
            <span>Участники ({totalMembers})</span>
            <button
              className={styles.addButton}
              onClick={() => setIsAddingMember(true)}
              title="Добавить участника"
            >
              <Plus size={16} />
            </button>
          </div>

          {isAddingMember ? (
            <form onSubmit={handleAddMember} className={styles.addForm}>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className={styles.emailInput}
                required
                autoFocus
              >
                <option value="">Выберите сотрудника</option>
                {orgMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email}
                  </option>
                ))}
              </select>
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitSmallButton}>
                  Добавить
                </button>
                <button
                  type="button"
                  className={styles.cancelSmallButton}
                  onClick={() => {
                    setIsAddingMember(false)
                    setSelectedMember("")
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.membersList}>
              {group.members.length === 0 ? (
                <p className={styles.emptyText}>Нет участников</p>
              ) : (
                group.members.map((member) => (
                  <div key={member.id} className={styles.memberItem}>
                    <div className={styles.memberInfo}>
                      <span className={styles.memberEmail}>{member.email}</span>
                      {member.name && (
                        <span className={styles.memberName}>{member.name}</span>
                      )}
                    </div>
                    {member.watched ? (
                      <CheckCircle size={16} className={styles.watchedIcon} />
                    ) : (
                      <Clock size={16} className={styles.notWatchedIcon} />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.sessionsSection}>
          <div className={styles.sectionHeader}>
            <Video size={18} />
            <span>Сессии ({group.sessions.length})</span>
            <button
              className={styles.addButton}
              onClick={() => setIsAddingSession(true)}
              title="Добавить сессию"
            >
              <Plus size={16} />
            </button>
          </div>

          {isAddingSession ? (
            <form onSubmit={handleAddSession} className={styles.addForm}>
              <label className={styles.fileLabel}>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                />
                <span className={styles.fileButton}>
                  {selectedFile ? selectedFile.name : "Выбрать видео"}
                </span>
              </label>
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.submitSmallButton}
                  disabled={!selectedFile}
                >
                  Загрузить
                </button>
                <button
                  type="button"
                  className={styles.cancelSmallButton}
                  onClick={() => {
                    setIsAddingSession(false)
                    setSelectedFile(null)
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.sessionsList}>
              {updatedSessions.length === 0 ? (
                <p className={styles.emptyText}>Нет сессий</p>
              ) : (
                updatedSessions.map((session) => (
                  <div key={session.id} className={styles.sessionItem}>
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionName}>{session.videoName}</span>
                      <span className={styles.sessionStats}>
                        Просмотрели: {session.watchedCount} / {session.totalMembers}
                      </span>
                    </div>
                    {session.canAnalyze && (
                      <button
                        className={styles.analyzeButton}
                        onClick={() => onAnalyze(group.id, session.id)}
                        title="Запустить комплексный анализ"
                      >
                        <BarChart3 size={16} />
                        Анализ
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupCard

