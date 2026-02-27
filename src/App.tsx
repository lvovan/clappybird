import { GameProvider, useGameContext } from './components/game/GameProvider'
import { GameCanvas } from './components/game/GameCanvas'
import { ScoreDisplay } from './components/ui/ScoreDisplay'
import { VolumeIndicator } from './components/ui/VolumeIndicator'
import { FallbackNotice } from './components/ui/FallbackNotice'
import { UpdateNotification } from './components/ui/UpdateNotification'
import { StartScreen } from './components/screens/StartScreen'
import { GameOverScreen } from './components/screens/GameOverScreen'
import { useVersionCheck } from './hooks/useVersionCheck'
import { useEffect, useState } from 'react'

function GameScreen() {
  const { gameStatus, score, isFallbackMode, startGame, restartGame } =
    useGameContext()

  const { updateAvailable, dismissed, dismiss, refresh } = useVersionCheck()

  const [showClapHint, setShowClapHint] = useState(false)

  // Show "Clap to fly!" hint for 3 seconds when gameplay starts
  useEffect(() => {
    if (gameStatus === 'playing') {
      setShowClapHint(true)
      const timer = setTimeout(() => {
        setShowClapHint(false)
      }, 3000)
      return () => {
        clearTimeout(timer)
      }
    } else {
      setShowClapHint(false)
    }
  }, [gameStatus])

  return (
    <div className="game-container">
      <GameCanvas />
      <ScoreDisplay />
      <VolumeIndicator />
      <FallbackNotice />

      {/* Version update notification */}
      {updateAvailable && !dismissed && (
        <UpdateNotification onRefresh={refresh} onDismiss={dismiss} />
      )}

      {/* Start Screen */}
      {gameStatus === 'idle' && (
        <StartScreen
          onStart={() => {
            void startGame()
          }}
        />
      )}

      {/* Calibrating Screen */}
      {gameStatus === 'calibrating' && (
        <div className="game-overlay">
          <div
            style={{
              background: 'rgba(0,0,0,0.6)',
              borderRadius: '16px',
              padding: '24px 32px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: '#fff',
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              Calibrating...
            </p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
              {isFallbackMode
                ? 'Microphone unavailable — tap/click to flap!'
                : 'Silence please, I\u2019m calibrating your microphone! \ud83e\udd2b'}
            </p>
          </div>
        </div>
      )}

      {/* Clap to fly hint */}
      {showClapHint && gameStatus === 'playing' && (
        <div
          className="game-overlay"
          style={{ pointerEvents: 'none', animation: 'fadeOut 1s ease 2s forwards' }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '16px',
              padding: '16px 28px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: '#fff',
                fontSize: '24px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              Clap to fly! 👏
            </p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameStatus === 'game-over' && (
        <GameOverScreen score={score} onRestart={restartGame} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  )
}
