import { useGameContext } from '../game/GameProvider'
import styles from './FallbackNotice.module.css'

export function FallbackNotice() {
  const { isFallbackMode, gameStatus } = useGameContext()

  if (!isFallbackMode) return null
  if (gameStatus !== 'playing' && gameStatus !== 'idle') return null

  return (
    <div className={styles.notice} role="status">
      <span className={styles.icon} aria-hidden="true">
        🎤
      </span>
      Microphone unavailable — tap or click to flap!
    </div>
  )
}
