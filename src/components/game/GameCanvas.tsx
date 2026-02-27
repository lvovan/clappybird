import { useCallback, useEffect, useRef } from 'react'
import { useGameContext } from './GameProvider'
import { useGameLoop } from '../../hooks/useGameLoop'
import type { GameState } from '../../hooks/useGameState'
import type { Coin, Obstacle } from '../../models/types'
import { getWallRects } from '../../models/obstacle'
import { GAME_WIDTH, GAME_HEIGHT, BIRD_X } from '../../models/constants'

const ASPECT_RATIO = GAME_WIDTH / GAME_HEIGHT // 9:16

// Colors
const BG_COLOR = '#70c5ce'
const GROUND_COLOR = '#ded895'
const GROUND_LINE_COLOR = '#54a048'
const BIRD_COLOR = '#f5c842'
const BIRD_EYE_COLOR = '#000'
const BIRD_BEAK_COLOR = '#e87d2a'
const WALL_COLOR = '#54a048'
const WALL_BORDER_COLOR = '#3a7a2e'
const COIN_COLOR = '#ffd700'
const COIN_BORDER_COLOR = '#daa520'

const GROUND_HEIGHT = 20

export function GameCanvas() {
  const {
    gameStatus,
    gameStateRef,
    audio,
    isFallbackMode,
    gameOver,
    incrementScore,
  } = useGameContext()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Resize canvas to fit container while maintaining aspect ratio
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const containerAspect = containerWidth / containerHeight

    let displayWidth: number
    let displayHeight: number

    if (containerAspect > ASPECT_RATIO) {
      // Container is wider — fit to height
      displayHeight = containerHeight
      displayWidth = displayHeight * ASPECT_RATIO
    } else {
      // Container is taller — fit to width
      displayWidth = containerWidth
      displayHeight = displayWidth / ASPECT_RATIO
    }

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(GAME_WIDTH * dpr)
    canvas.height = Math.round(GAME_HEIGHT * dpr)
    canvas.style.width = `${String(Math.round(displayWidth))}px`
    canvas.style.height = `${String(Math.round(displayHeight))}px`

    const ctx = canvas.getContext('2d', { alpha: false })
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }, [])

  // ResizeObserver for dynamic resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    resizeCanvas()

    const observer = new ResizeObserver(() => {
      resizeCanvas()
    })
    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [resizeCanvas])

  // Draw function
  const draw = useCallback((state: GameState) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // 1. Background
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // 2. Obstacles (wall pairs)
    state.obstacles.forEach((obs: Obstacle) => {
      const [topWall, bottomWall] = getWallRects(obs)

      // Top wall
      ctx.fillStyle = WALL_COLOR
      ctx.fillRect(
        Math.round(topWall.x),
        Math.round(topWall.y),
        Math.round(topWall.width),
        Math.round(topWall.height),
      )
      ctx.strokeStyle = WALL_BORDER_COLOR
      ctx.lineWidth = 2
      ctx.strokeRect(
        Math.round(topWall.x),
        Math.round(topWall.y),
        Math.round(topWall.width),
        Math.round(topWall.height),
      )

      // Top wall cap
      ctx.fillStyle = WALL_BORDER_COLOR
      ctx.fillRect(
        Math.round(topWall.x - 3),
        Math.round(topWall.height - 20),
        Math.round(topWall.width + 6),
        20,
      )

      // Bottom wall
      ctx.fillStyle = WALL_COLOR
      ctx.fillRect(
        Math.round(bottomWall.x),
        Math.round(bottomWall.y),
        Math.round(bottomWall.width),
        Math.round(bottomWall.height),
      )
      ctx.strokeStyle = WALL_BORDER_COLOR
      ctx.lineWidth = 2
      ctx.strokeRect(
        Math.round(bottomWall.x),
        Math.round(bottomWall.y),
        Math.round(bottomWall.width),
        Math.round(bottomWall.height),
      )

      // Bottom wall cap
      ctx.fillStyle = WALL_BORDER_COLOR
      ctx.fillRect(
        Math.round(bottomWall.x - 3),
        Math.round(bottomWall.y),
        Math.round(bottomWall.width + 6),
        20,
      )
    })

    // 3. Coins (spinning)
    state.coins.forEach((coin: Coin) => {
      if (coin.collected) return

      ctx.save()
      ctx.translate(Math.round(coin.x), Math.round(coin.y))
      // Simulate spin by scaling x axis
      const scaleX = Math.abs(Math.cos(coin.spinAngle))
      ctx.scale(Math.max(scaleX, 0.2), 1)

      ctx.beginPath()
      ctx.arc(0, 0, coin.radius, 0, Math.PI * 2)
      ctx.fillStyle = COIN_COLOR
      ctx.fill()
      ctx.strokeStyle = COIN_BORDER_COLOR
      ctx.lineWidth = 2
      ctx.stroke()

      // Dollar sign on coin
      ctx.fillStyle = COIN_BORDER_COLOR
      ctx.font = `bold ${String(coin.radius)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('$', 0, 1)

      ctx.restore()
    })

    // 4. Bird
    const bird = state.bird
    const bx = Math.round(BIRD_X - bird.width / 2)
    const by = Math.round(bird.y - bird.height / 2)

    // Body
    ctx.fillStyle = BIRD_COLOR
    ctx.beginPath()
    ctx.ellipse(
      bx + bird.width / 2,
      by + bird.height / 2,
      bird.width / 2,
      bird.height / 2,
      0,
      0,
      Math.PI * 2,
    )
    ctx.fill()

    // Eye
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(bx + bird.width * 0.65, by + bird.height * 0.35, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = BIRD_EYE_COLOR
    ctx.beginPath()
    ctx.arc(bx + bird.width * 0.7, by + bird.height * 0.35, 2.5, 0, Math.PI * 2)
    ctx.fill()

    // Beak
    ctx.fillStyle = BIRD_BEAK_COLOR
    ctx.beginPath()
    ctx.moveTo(bx + bird.width, by + bird.height * 0.45)
    ctx.lineTo(bx + bird.width + 8, by + bird.height * 0.5)
    ctx.lineTo(bx + bird.width, by + bird.height * 0.6)
    ctx.closePath()
    ctx.fill()

    // Wing (simple flap animation)
    const wingY =
      by + bird.height * 0.5 + Math.sin(state.elapsedTime * 0.01) * 4
    ctx.fillStyle = '#e8b830'
    ctx.beginPath()
    ctx.ellipse(
      bx + bird.width * 0.3,
      wingY,
      bird.width * 0.3,
      bird.height * 0.2,
      -0.2,
      0,
      Math.PI * 2,
    )
    ctx.fill()

    // 5. Ground line
    ctx.fillStyle = GROUND_COLOR
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT)
    ctx.fillStyle = GROUND_LINE_COLOR
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, 3)
  }, [])

  // Initial draw when idle
  useEffect(() => {
    if (gameStatus === 'idle') {
      resizeCanvas()
      const state = gameStateRef.current
      draw(state)
    }
  }, [gameStatus, gameStateRef, draw, resizeCanvas])

  // Use game loop when playing
  useGameLoop({
    gameStateRef,
    smoothedVolumeRef: audio.smoothedVolume,
    thresholdRef: audio.threshold,
    canvasRef,
    isFallbackMode,
    onScoreIncrement: incrementScore,
    onGameOver: gameOver,
    draw,
    isPlaying: gameStatus === 'playing',
  })

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        touchAction: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  )
}
