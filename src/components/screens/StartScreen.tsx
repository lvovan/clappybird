import styles from './StartScreen.module.css'

interface StartScreenProps {
  onStart: () => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className={styles.overlay}>
      <h1 className={styles.title}>Screamy Bird</h1>
      <p className={styles.subtitle}>Scream to fly! 🎤</p>
      <button className="game-btn game-btn-primary" onClick={onStart}>
        Start Game
      </button>
      <p className={styles.instructions}>
        Make noise to fly up.
        <br />
        Stay quiet to fall.
        <br />
        Dodge pipes. Collect coins.
      </p>
    </div>
  )
}
