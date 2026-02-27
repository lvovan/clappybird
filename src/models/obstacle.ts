import type { Obstacle, WallRect } from './types'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GAP_HEIGHT,
  OBSTACLE_WIDTH,
  MIN_GAP_MARGIN,
} from './constants'

export function createObstacle(xOffset = 0): Obstacle {
  const minY = MIN_GAP_MARGIN
  const maxY = GAME_HEIGHT - MIN_GAP_MARGIN
  const gapCenterY = minY + Math.random() * (maxY - minY)

  return {
    x: GAME_WIDTH + OBSTACLE_WIDTH + xOffset,
    gapCenterY,
    gapHeight: GAP_HEIGHT,
    width: OBSTACLE_WIDTH,
    passed: false,
  }
}

export function getWallRects(obstacle: Obstacle): [WallRect, WallRect] {
  const topHeight = obstacle.gapCenterY - obstacle.gapHeight / 2
  const bottomY = obstacle.gapCenterY + obstacle.gapHeight / 2

  const topWall: WallRect = {
    x: obstacle.x,
    y: 0,
    width: obstacle.width,
    height: topHeight,
  }

  const bottomWall: WallRect = {
    x: obstacle.x,
    y: bottomY,
    width: obstacle.width,
    height: GAME_HEIGHT - bottomY,
  }

  return [topWall, bottomWall]
}

export function moveObstacle(
  obstacle: Obstacle,
  dt: number,
  scrollSpeed: number,
): Obstacle {
  return {
    ...obstacle,
    x: obstacle.x - scrollSpeed * dt,
  }
}

export function isOffScreen(obstacle: Obstacle): boolean {
  return obstacle.x + obstacle.width < -obstacle.width
}

export function markPassed(obstacle: Obstacle, birdX: number): Obstacle {
  if (!obstacle.passed && obstacle.x + obstacle.width < birdX) {
    return { ...obstacle, passed: true }
  }
  return obstacle
}
