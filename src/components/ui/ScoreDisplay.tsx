import { useGameContext } from '../game/GameProvider'
import styles from './ScoreDisplay.module.css'

export function ScoreDisplay() {
  const { gameStatus, score } = useGameContext()

  if (gameStatus !== 'playing' && gameStatus !== 'game-over') {
    return null
  }

  return (
    <div
      className={styles.scoreDisplay}
      aria-live="polite"
      aria-label={`Score: ${String(score)}`}
    >
      {score}
    </div>
  )
}
