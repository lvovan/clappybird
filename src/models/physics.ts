import type { Bird, WallRect } from './types'
import {
  GRAVITY,
  FLAP_IMPULSE,
  HOVER_DECEL,
  MAX_FALL_SPEED,
  PHYSICS_TIMESTEP,
  MAX_PHYSICS_STEPS,
  MAX_FRAME_DELTA,
  BIRD_X,
  GAME_HEIGHT,
} from './constants'

// --- Velocity modifiers ---

export function applyGravity(velocity: number, dt: number): number {
  return velocity + GRAVITY * dt
}

export function applyFlap(): number {
  return FLAP_IMPULSE
}

export function applyHover(velocity: number, dt: number): number {
  return velocity + HOVER_DECEL * dt
}

export function clampVelocity(velocity: number): number {
  return Math.min(Math.max(velocity, -MAX_FALL_SPEED), MAX_FALL_SPEED)
}

// --- Volume-to-force mapping (three-tier) ---

export function mapVolumeToForce(
  volume: number,
  threshold: number,
  currentVelocity: number,
  dt: number,
): number {
  const lowThreshold = threshold
  const highThreshold = threshold * 2

  if (volume > highThreshold) {
    // Loud: full flap
    return applyFlap()
  } else if (volume >= lowThreshold) {
    // Moderate: hover (partial upward force)
    return applyHover(currentVelocity, dt)
  } else {
    // Silent: gravity only
    return applyGravity(currentVelocity, dt)
  }
}

// --- AABB collision detection ---

export function rectangleOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

export function checkBirdWallCollision(bird: Bird, walls: WallRect[]): boolean {
  const shrink = bird.hitboxShrink
  const bw = bird.width * shrink
  const bh = bird.height * shrink
  const bx = BIRD_X - bw / 2
  const by = bird.y - bh / 2

  for (const wall of walls) {
    if (
      rectangleOverlap(bx, by, bw, bh, wall.x, wall.y, wall.width, wall.height)
    ) {
      return true
    }
  }
  return false
}

export function checkBirdBoundaryCollision(bird: Bird): boolean {
  const shrink = bird.hitboxShrink
  const bh = bird.height * shrink
  const by = bird.y - bh / 2

  // Top boundary
  if (by <= 0) return true
  // Bottom boundary (ground)
  if (by + bh >= GAME_HEIGHT) return true

  return false
}

// --- Fixed timestep update ---

export interface PhysicsStepResult {
  bird: Bird
  accumulator: number
}

export function fixedTimestepUpdate(
  bird: Bird,
  rawDelta: number,
  accumulator: number,
  volume: number,
  threshold: number,
  updateBird: (bird: Bird, dt: number) => Bird,
): PhysicsStepResult {
  const delta = Math.min(rawDelta, MAX_FRAME_DELTA)
  let acc = accumulator + delta
  let currentBird = bird
  let steps = 0

  while (acc >= PHYSICS_TIMESTEP && steps < MAX_PHYSICS_STEPS) {
    // Apply volume-based force
    const newVelocity = mapVolumeToForce(
      volume,
      threshold,
      currentBird.velocity,
      PHYSICS_TIMESTEP,
    )

    currentBird = {
      ...currentBird,
      velocity: clampVelocity(newVelocity),
    }

    // Update position
    currentBird = updateBird(currentBird, PHYSICS_TIMESTEP)

    acc -= PHYSICS_TIMESTEP
    steps++
  }

  return {
    bird: currentBird,
    accumulator: acc,
  }
}
