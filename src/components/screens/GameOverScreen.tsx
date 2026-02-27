import styles from './GameOverScreen.module.css'

interface GameOverScreenProps {
  score: number
  onRestart: () => void
}

export function GameOverScreen({ score, onRestart }: GameOverScreenProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.heading}>Game Over</h2>
        <p className={styles.score}>{score}</p>
        <p className={styles.label}>points</p>
        <button className="game-btn game-btn-secondary" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  )
}
