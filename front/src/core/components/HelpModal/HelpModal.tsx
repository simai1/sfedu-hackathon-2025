import { X } from "lucide-react"
import styles from "./HelpModal.module.scss"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null

  const steps = [
    {
      number: 1,
      title: "Регистрация в приложении",
      description:
        "Зарегистрируйтесь в веб-приложении, создав аккаунт с вашим именем пользователя, email и паролем.",
    },
    {
      number: 2,
      title: "Получение токена",
      description:
        "После входа в систему перейдите в раздел 'Профиль' и скопируйте ваш API токен. Этот токен необходим для подключения desktop приложения.",
    },
    {
      number: 3,
      title: "Скачивание приложения",
      description:
        "Скачайте и установите desktop приложение BrainBit на ваш компьютер. Приложение доступно для Windows, macOS и Linux.",
    },
    {
      number: 4,
      title: "Подключение к браслету BrainBit",
      description:
        "Включите ваш браслет BrainBit и запустите desktop приложение. Введите скопированный API токен в настройках приложения для подключения к веб-сервису.",
    },
    {
      number: 5,
      title: "Работа с видео",
      description:
        "В разделе 'Анализ' загрузите видеофайл, который хотите проанализировать. Система автоматически начнет запись данных с браслета при воспроизведении видео.",
    },
    {
      number: 6,
      title: "Анализ данных",
      description:
        "Во время просмотра видео вы увидите графики в реальном времени: концентрацию, Расслабленность, данные по каналам (O1, O2, T3, T4) и спектральные показатели (Alpha, Beta, Gamma). После завершения анализа вы получите детальный отчет.",
    },
  ]

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Инструкция по использованию</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.stepsContainer}>
            {steps.map((step) => (
              <div key={step.number} className={styles.step}>
                <div className={styles.stepNumber}>{step.number}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeFooterButton} onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  )
}

export default HelpModal

