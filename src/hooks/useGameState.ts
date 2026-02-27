import { useCallback, useRef, useState } from 'react'
import type { Bird, Coin, GameStatus, Obstacle } from '../models/types'
import { createBird } from '../models/bird'
import { SCROLL_SPEED } from '../models/constants'

export interface GameState {
  status: GameStatus
  score: number
  bird: Bird
  obstacles: Obstacle[]
  coins: Coin[]
  scrollSpeed: number
  elapsedTime: number
}

function createInitialState(): GameState {
  return {
    status: 'idle',
    score: 0,
    bird: createBird(),
    obstacles: [],
    coins: [],
    scrollSpeed: SCROLL_SPEED,
    elapsedTime: 0,
  }
}

export function useGameState() {
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle')
  const [score, setScore] = useState(0)

  // Mutable game state in ref (no re-renders during gameplay)
  const gameStateRef = useRef<GameState>(createInitialState())

  const startCalibrating = useCallback(() => {
    setGameStatus('calibrating')
    gameStateRef.current.status = 'calibrating'
  }, [])

  const startPlaying = useCallback(() => {
    const state = gameStateRef.current
    state.status = 'playing'
    state.bird = createBird()
    state.obstacles = []
    state.coins = []
    state.score = 0
    state.elapsedTime = 0
    setGameStatus('playing')
    setScore(0)
  }, [])

  const pause = useCallback(() => {
    gameStateRef.current.status = 'paused'
    setGameStatus('paused')
  }, [])

  const unpause = useCallback(() => {
    gameStateRef.current.status = 'playing'
    setGameStatus('playing')
  }, [])

  const gameOver = useCallback(() => {
    gameStateRef.current.status = 'game-over'
    gameStateRef.current.bird.alive = false
    setGameStatus('game-over')
  }, [])

  const restart = useCallback(() => {
    const freshState = createInitialState()
    gameStateRef.current = freshState
    setGameStatus('idle')
    setScore(0)
  }, [])

  const incrementScore = useCallback(() => {
    gameStateRef.current.score += 1
    setScore(gameStateRef.current.score)
  }, [])

  return {
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
  }
}
