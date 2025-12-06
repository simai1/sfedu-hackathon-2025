import { useState } from "react"
import { X } from "lucide-react"
import styles from "./CreateGroupModal.module.scss"

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { name: string; description: string }) => void
}

function CreateGroupModal({ isOpen, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState({ name: "", description: "" })

  if (!isOpen) return null

  const validate = () => {
    const newErrors = { name: "", description: "" }
    let isValid = true

    if (!name.trim()) {
      newErrors.name = "Название группы обязательно"
      isValid = false
    }

    if (!description.trim()) {
      newErrors.description = "Описание группы обязательно"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onCreate({ name: name.trim(), description: description.trim() })
      setName("")
      setDescription("")
      setErrors({ name: "", description: "" })
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Создать группу</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Название группы *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors({ ...errors, name: "" })
              }}
              className={errors.name ? styles.error : ""}
              placeholder="Введите название группы"
            />
            {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Описание *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors({ ...errors, description: "" })
              }}
              className={errors.description ? styles.error : ""}
              placeholder="Введите описание группы"
              rows={4}
            />
            {errors.description && (
              <span className={styles.errorMessage}>{errors.description}</span>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGroupModal

