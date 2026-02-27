import { useEffect, useRef, useState } from 'react'
import { useGameContext } from '../game/GameProvider'
import styles from './VolumeIndicator.module.css'

export function VolumeIndicator() {
  const { gameStatus, audio } = useGameContext()
  const [volumePercent, setVolumePercent] = useState(0)
  const [thresholdPercent, setThresholdPercent] = useState(0)
  const rafRef = useRef<number>(0)

  const visible = gameStatus === 'calibrating' || gameStatus === 'playing'

  useEffect(() => {
    if (!visible) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      return
    }

    const update = () => {
      const vol = audio.smoothedVolume.current
      const thresh = audio.threshold.current
      // Normalize to 0-100 range (volume is typically 0-0.5, clamp to 1)
      setVolumePercent(Math.min(vol * 200, 100))
      setThresholdPercent(Math.min(thresh * 200, 100))
      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
    }
  }, [visible, audio.smoothedVolume, audio.threshold])

  if (!visible) return null

  return (
    <div className={styles.volumeContainer} aria-hidden="true">
      <div className={styles.volumeBar}>
        <div
          className={styles.volumeFill}
          style={{ height: `${String(volumePercent)}%` }}
        />
        {thresholdPercent > 0 && (
          <div
            className={styles.thresholdLine}
            style={{ bottom: `${String(thresholdPercent)}%` }}
          />
        )}
      </div>
      <span className={styles.label}>MIC</span>
    </div>
  )
}
