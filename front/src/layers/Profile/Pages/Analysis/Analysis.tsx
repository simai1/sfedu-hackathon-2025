import ChatMessagerComponent from "../../../../core/components/ChatMessagerComponent/ChatMessagerComponent"
import KeyIndicators from "../../modules/graphics/KeyIndicators/KeyIndicators"
import styles from "./Analysis.module.scss"

function Analysis() {
  return (
    <div className={styles.analysisContainer}>
    <div className={styles.analysis}>
      <h1>Анализ активности</h1>
      <div className={styles.chartContainer}>
        <KeyIndicators />
      </div>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <h3>Общее время</h3>
          <p>120 часов</p>
        </div>
        <div className={styles.statItem}>
          <h3>Завершенные задачи</h3>
          <p>42</p>
        </div>
        <div className={styles.statItem}>
          <h3>Уровень вовлеченности</h3>
          <p>85%</p>
        </div>
      </div>
      
    </div>
    <div className={styles.chat}>
    <ChatMessagerComponent />
  </div>
  </div>
  )
}

export default Analysis
