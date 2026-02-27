import styles from './StartScreen.module.css'

interface StartScreenProps {
  onStart: () => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className={styles.overlay}>
      <h1 className={styles.title}>Clappy Bird</h1>
      <p className={styles.subtitle}>Clap to fly! 👏</p>
      <button className="game-btn game-btn-primary" onClick={onStart}>
        Start Game
      </button>
      <p className={styles.instructions}>
        Clap to fly up.
        <br />
        Stay quiet to fall.
        <br />
        Dodge pipes. Collect coins.
      </p>
      <p className={styles.copyright}>
        ©️ 2026 Nathan & Luc Vo Van - Built with AI
      </p>
    </div>
  )
}
