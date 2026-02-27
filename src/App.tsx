import { GameProvider, useGameContext } from './components/game/GameProvider'
import { GameCanvas } from './components/game/GameCanvas'
import { ScoreDisplay } from './components/ui/ScoreDisplay'
import { VolumeIndicator } from './components/ui/VolumeIndicator'
import { FallbackNotice } from './components/ui/FallbackNotice'
import { StartScreen } from './components/screens/StartScreen'
import { GameOverScreen } from './components/screens/GameOverScreen'

function GameScreen() {
  const { gameStatus, score, isFallbackMode, startGame, restartGame } =
    useGameContext()

  return (
    <div className="game-container">
      <GameCanvas />
      <ScoreDisplay />
      <VolumeIndicator />
      <FallbackNotice />

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
                : 'Stay quiet for a moment...'}
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
