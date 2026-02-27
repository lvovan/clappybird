import type { Bird } from './types'
import { BIRD_SIZE, BIRD_HITBOX_SHRINK, GAME_HEIGHT } from './constants'

export function createBird(): Bird {
  return {
    y: GAME_HEIGHT / 2,
    velocity: 0,
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    hitboxShrink: BIRD_HITBOX_SHRINK,
    alive: true,
    flapFrame: 0,
  }
}

export function updateBirdPosition(bird: Bird, dt: number): Bird {
  const newY = bird.y + bird.velocity * dt
  const clampedY = Math.max(0, Math.min(GAME_HEIGHT, newY))
  return {
    ...bird,
    y: clampedY,
  }
}
