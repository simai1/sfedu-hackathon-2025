import styles from "./KeyIndicators.module.scss"
import ConcentrationEngagementChart from "./components/ConcentrationEngagementChart/ConcentrationEngagementChart"
import ChannelsCharts from "./components/ChannelsCharts/ChannelsCharts"
import SpectralChart from "./components/SpectralChart/SpectralChart"

function KeyIndicators() {
  return (
    <div className={styles.KeyIndicators}>
      <ConcentrationEngagementChart />
      <ChannelsCharts />
      <SpectralChart />
    </div>
  )
}

export default KeyIndicators
