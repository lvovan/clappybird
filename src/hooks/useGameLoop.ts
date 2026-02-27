import { useCallback, useEffect, useRef } from 'react'
import type { Coin, Obstacle } from '../models/types'
import type { GameState } from './useGameState'
import { updateBirdPosition } from '../models/bird'
import {
  createObstacle,
  getWallRects,
  isOffScreen,
  markPassed,
  moveObstacle,
} from '../models/obstacle'
import {
  checkCoinCollection,
  collectCoin,
  createCoin,
  moveCoin,
  updateCoinSpin,
} from '../models/coin'
import {
  checkBirdBoundaryCollision,
  checkBirdWallCollision,
  fixedTimestepUpdate,
} from '../models/physics'
import {
  BIRD_X,
  GAME_WIDTH,
  MIN_OBSTACLE_SPACING,
  FLAP_IMPULSE,
} from '../models/constants'

export interface UseGameLoopOptions {
  gameStateRef: React.RefObject<GameState>
  smoothedVolumeRef: React.RefObject<number>
  thresholdRef: React.RefObject<number>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  isFallbackMode: boolean
  onScoreIncrement: () => void
  onGameOver: () => void
  draw: (state: GameState) => void
  isPlaying: boolean
}

export function useGameLoop({
  gameStateRef,
  smoothedVolumeRef,
  thresholdRef,
  canvasRef,
  isFallbackMode,
  onScoreIncrement,
  onGameOver,
  draw,
  isPlaying,
}: UseGameLoopOptions) {
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const accumulatorRef = useRef(0)
  const flapRequestRef = useRef(false)

  // Fallback tap-to-flap handler
  const handlePointerDown = useCallback(() => {
    flapRequestRef.current = true
  }, [])

  // Register/unregister fallback pointer listener
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isFallbackMode || !isPlaying) return

    canvas.addEventListener('pointerdown', handlePointerDown)
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [canvasRef, isFallbackMode, isPlaying, handlePointerDown])

  // Visibility change: pause/resume
  useEffect(() => {
    if (!isPlaying) return

    const handleVisibility = () => {
      if (document.hidden) {
        // Pause handled by parent via onPause callback
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isPlaying])

  // Main game loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    lastTimeRef.current = 0
    accumulatorRef.current = 0

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
      }

      const rawDelta = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      const gs = gameStateRef.current
      if (gs.status !== 'playing') {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Determine volume input
      let volume = smoothedVolumeRef.current
      const threshold = thresholdRef.current

      // Handle fallback tap-to-flap
      if (isFallbackMode && flapRequestRef.current) {
        // Simulate a loud volume to trigger flap
        volume = threshold * 3
        flapRequestRef.current = false
      }

      // Physics: fixed timestep update
      const physicsResult = fixedTimestepUpdate(
        gs.bird,
        rawDelta,
        accumulatorRef.current,
        volume,
        threshold,
        updateBirdPosition,
      )
      gs.bird = physicsResult.bird
      accumulatorRef.current = physicsResult.accumulator

      // Handle fallback: direct flap impulse if tapped
      if (isFallbackMode && flapRequestRef.current) {
        gs.bird.velocity = FLAP_IMPULSE
        flapRequestRef.current = false
      }

      // Update elapsed time
      gs.elapsedTime += rawDelta

      // Move obstacles and coins
      gs.obstacles = gs.obstacles.map((o) =>
        moveObstacle(o, rawDelta, gs.scrollSpeed),
      )
      gs.coins = gs.coins.map((c) => {
        const moved = moveCoin(c, rawDelta, gs.scrollSpeed)
        return updateCoinSpin(moved, rawDelta)
      })

      // Spawn new obstacles
      const lastObstacle = gs.obstacles.at(-1)
      const shouldSpawn =
        lastObstacle === undefined ||
        lastObstacle.x < GAME_WIDTH - MIN_OBSTACLE_SPACING

      if (shouldSpawn) {
        const newObstacle = createObstacle()
        const newCoin = createCoin(
          newObstacle.x,
          newObstacle.width,
          newObstacle.gapCenterY,
        )
        gs.obstacles.push(newObstacle)
        gs.coins.push(newCoin)
      }

      // Mark passed obstacles
      gs.obstacles = gs.obstacles.map((o) => markPassed(o, BIRD_X))

      // Check coin collection
      gs.coins = gs.coins.map((coin: Coin) => {
        if (!coin.collected && checkCoinCollection(coin, gs.bird)) {
          onScoreIncrement()
          return collectCoin(coin)
        }
        return coin
      })

      // Remove off-screen obstacles and their coins
      const toRemoveIndexes = new Set<number>()
      gs.obstacles.forEach((o: Obstacle, i: number) => {
        if (isOffScreen(o)) toRemoveIndexes.add(i)
      })
      gs.obstacles = gs.obstacles.filter(
        (_: Obstacle, i: number) => !toRemoveIndexes.has(i),
      )
      gs.coins = gs.coins.filter(
        (_: Coin, i: number) => !toRemoveIndexes.has(i),
      )

      // Collision detection
      // Check boundary collision
      if (checkBirdBoundaryCollision(gs.bird)) {
        onGameOver()
        draw(gs)
        return
      }

      // Check wall collision (only nearest obstacles)
      const nearbyObstacles = gs.obstacles.filter(
        (o: Obstacle) => o.x < BIRD_X + 60 && o.x + o.width > BIRD_X - 60,
      )

      for (const obs of nearbyObstacles) {
        const walls = getWallRects(obs)
        if (checkBirdWallCollision(gs.bird, walls)) {
          onGameOver()
          draw(gs)
          return
        }
      }

      // Draw
      draw(gs)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [
    isPlaying,
    gameStateRef,
    smoothedVolumeRef,
    thresholdRef,
    isFallbackMode,
    onScoreIncrement,
    onGameOver,
    draw,
  ])
}
