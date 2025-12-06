import { useState } from "react"
import { Check } from "lucide-react"
import { Role, useUserStore } from "../../../../store/userStore"
import styles from "./SubscriptionPlans.module.scss"

type PlanType =
  | "free"
  | "standard"
  | "pro"
  | "ultimate"
  | "org_starter"
  | "org_growth"
  | "org_enterprise"

interface Plan {
  id: PlanType
  name: string
  price: string
  description: string
  features: {
    included: string[]
    excluded?: string[]
  }
  limits: {
    reports: string
    requests: string
    analysis: string
    storage: string
  }
  popular?: boolean
}

const individualPlans: Plan[] = [
  {
    id: "standard",
    name: "Стандарт",
    price: "990 ₽/мес",
    description: "Для индивидуальных пользователей",
    features: {
      included: [
        "Базовые отчеты",
        "До 10 анализов в месяц",
        "История анализов (30 дней)",
        "Email поддержка",
      ],
    },
    limits: {
      reports: "Базовые",
      requests: "До 10/мес",
      analysis: "Стандартная",
      storage: "1 GB",
    },
  },
  {
    id: "pro",
    name: "Про",
    price: "2490 ₽/мес",
    description: "Для профессионалов",
    features: {
      included: [
        "Расширенные отчеты",
        "До 50 анализов в месяц",
        "История анализов (90 дней)",
        "Приоритетная поддержка",
        "Экспорт данных",
        "API доступ",
      ],
    },
    limits: {
      reports: "Расширенные",
      requests: "До 50/мес",
      analysis: "Углубленная",
      storage: "5 GB",
    },
    popular: true,
  },
  {
    id: "ultimate",
    name: "Ультимейт",
    price: "4990 ₽/мес",
    description: "Для команд и организаций",
    features: {
      included: [
        "Полные детальные отчеты",
        "Неограниченные анализы",
        "Безлимитная история",
        "24/7 поддержка",
        "Экспорт всех форматов",
        "Полный API доступ",
        "Приоритетная обработка",
        "Персональный менеджер",
      ],
    },
    limits: {
      reports: "Полные детальные",
      requests: "Безлимит",
      analysis: "Максимальная",
      storage: "Безлимит",
    },
  },
]

const organizationPlans: Plan[] = [
  {
    id: "org_starter",
    name: "Орг. Старт",
    price: "4 900 ₽/мес",
    description: "Для небольших команд и пилотов",
    features: {
      included: [
        "Группы и приглашения участников",
        "До 5 сессий в месяц",
        "Статистика просмотров",
        "Базовые отчеты по группам",
        "Поддержка по email",
      ],
    },
    limits: {
      reports: "Базовые групповые",
      requests: "До 5 сессий/мес",
      analysis: "Стандартная",
      storage: "10 GB",
    },
  },
  {
    id: "org_growth",
    name: "Орг. Рост",
    price: "9 900 ₽/мес",
    description: "Для растущих организаций",
    features: {
      included: [
        "Неограниченные группы",
        "До 20 сессий в месяц",
        "Подробная статистика и отчеты",
        "Экспорт данных и API доступ",
        "Приоритетная поддержка",
      ],
    },
    limits: {
      reports: "Расширенные групповые",
      requests: "До 20 сессий/мес",
      analysis: "Углубленная",
      storage: "100 GB",
    },
    popular: true,
  },
  {
    id: "org_enterprise",
    name: "Орг. Enterprise",
    price: "По запросу",
    description: "Для крупных компаний и сетей",
    features: {
      included: [
        "SLA и выделенный менеджер",
        "Безлимитные сессии и группы",
        "Продвинутая аналитика по организациям",
        "Интеграции (SSO, аудит логов)",
        "Гибкие лимиты хранения",
      ],
    },
    limits: {
      reports: "Полные корпоративные",
      requests: "Безлимит",
      analysis: "Максимальная + кастом",
      storage: "По договоренности",
    },
  },
]

interface SubscriptionPlansProps {
  currentPlan?: PlanType
}

function SubscriptionPlans({ currentPlan = "free" }: SubscriptionPlansProps) {
  const { user } = useUserStore()
  const isOrganization = user?.role === Role.ORGANIZATION
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)

  const plans = isOrganization ? organizationPlans : individualPlans

  const getCurrentPlanName = () => {
    if (currentPlan === "free") return "Бесплатная пробная mvp подписка"
    const plan = plans.find((p) => p.id === currentPlan)
    return plan ? plan.name : "Бесплатная пробная mvp подписка"
  }

  const handleSelectPlan = (planId: PlanType) => {
    setSelectedPlan(planId)
    console.log("Выбран план:", planId)
    // TODO: добавить интеграцию с платежной системой
  }

  return (
    <div className={styles.subscriptionPlans}>
      <div className={styles.currentPlan}>
        <h2>Текущий план подписки</h2>
        <div className={styles.currentPlanCard}>
          <div className={styles.currentPlanInfo}>
            <span className={styles.currentPlanName}>{getCurrentPlanName()}</span>
            {currentPlan === "free" && (
              <span className={styles.trialBadge}>Пробный период</span>
            )}
          </div>
          {currentPlan === "free" && (
            <p className={styles.trialDescription}>
              У вас есть доступ к базовым функциям. Выберите подходящий план для расширенных
              возможностей.
            </p>
          )}
        </div>
      </div>

      <div className={styles.plansSection}>
        <h2>Доступные планы</h2>
        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.planCard} ${plan.popular ? styles.popular : ""} ${
                selectedPlan === plan.id ? styles.selected : ""
              }`}
            >
              {plan.popular && <div className={styles.popularBadge}>Популярный</div>}

              <div className={styles.planHeader}>
                <h3>{plan.name}</h3>
                <div className={styles.planPrice}>{plan.price}</div>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              <div className={styles.planLimits}>
                <div className={styles.limitItem}>
                  <span className={styles.limitLabel}>Отчеты:</span>
                  <span className={styles.limitValue}>{plan.limits.reports}</span>
                </div>
                <div className={styles.limitItem}>
                  <span className={styles.limitLabel}>Запросы:</span>
                  <span className={styles.limitValue}>{plan.limits.requests}</span>
                </div>
                <div className={styles.limitItem}>
                  <span className={styles.limitLabel}>Анализ:</span>
                  <span className={styles.limitValue}>{plan.limits.analysis}</span>
                </div>
                <div className={styles.limitItem}>
                  <span className={styles.limitLabel}>Хранилище:</span>
                  <span className={styles.limitValue}>{plan.limits.storage}</span>
                </div>
              </div>

              <div className={styles.planFeatures}>
                <h4>Включено:</h4>
                <ul>
                  {plan.features.included.map((feature, index) => (
                    <li key={index}>
                      <Check size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={styles.selectButton}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? "Текущий план" : "Выбрать план"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPlans

