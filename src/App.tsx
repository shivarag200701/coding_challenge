import './App.css'
import { useBalloonData } from './hooks/useBalloonData'
import { useAlertData } from './hooks/useAlertData'
import BalloonMap from './components/BalloonMap'
import { extractBalloonPositionsLimited } from './utils/balloonData'

function App() {
  const { data24h, loading } = useBalloonData();
  console.log("data24h",data24h);
  // Extract balloon positions from the data (limited for testing)
  const balloons = extractBalloonPositionsLimited(data24h);
  const { alerts, loadingAlerts } = useAlertData();

  return (
    <BalloonMap 
      balloons={balloons}
      alerts={alerts}
      loading={loading}
      loadingAlerts={loadingAlerts}
    />
  );
}

export default App
