import { createContext, useContext, useCallback, type ReactNode } from 'react'
import type { GameStatus } from '../../models/types'
import { useGameState, type GameState } from '../../hooks/useGameState'
import {
  useAudioInput,
  type UseAudioInputReturn,
} from '../../hooks/useAudioInput'
import { trackEvent, setTag } from '../../services/clarityService'

interface GameContextValue {
  gameStatus: GameStatus
  score: number
  isFallbackMode: boolean
  gameStateRef: React.RefObject<GameState>
  audio: UseAudioInputReturn
  startGame: () => Promise<void>
  restartGame: () => void
  pause: () => void
  unpause: () => void
  gameOver: () => void
  incrementScore: () => void
  startPlaying: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return ctx
}

interface GameProviderProps {
  children: ReactNode
}

export function GameProvider({ children }: GameProviderProps) {
  const {
    gameStatus,
    score,
    gameStateRef,
    startCalibrating,
    startPlaying,
    pause,
    unpause,
    gameOver,
    restart,
    incrementScore,
  } = useGameState()

  const audio = useAudioInput()

  const startGame = useCallback(async () => {
    trackEvent('game_started')

    if (audio.isFallbackMode) {
      // No mic: skip calibration, go directly to playing
      startPlaying()
      return
    }

    // Start audio capture (AudioContext created sync in this click handler)
    await audio.startCapture()

    if (audio.permissionStatus === 'granted' || audio.isActive) {
      startCalibrating()
      // Run calibration
      await audio.calibrate()
      trackEvent('calibration_complete')
      startPlaying()
    } else {
      // Permission denied or unavailable — fallback mode
      startPlaying()
    }
  }, [audio, startCalibrating, startPlaying])

  const restartGame = useCallback(() => {
    audio.stopCapture()
    restart()
  }, [audio, restart])

  const handleGameOver = useCallback(() => {
    trackEvent('game_over')
    setTag('final_score', String(score))
    gameOver()
  }, [gameOver, score])

  const value: GameContextValue = {
    gameStatus,
    score,
    isFallbackMode: audio.isFallbackMode,
    gameStateRef,
    audio,
    startGame,
    restartGame,
    pause,
    unpause,
    gameOver: handleGameOver,
    incrementScore,
    startPlaying,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
