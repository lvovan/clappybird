import type { Bird, Coin } from './types'
import { COIN_RADIUS, BIRD_X } from './constants'

export function createCoin(
  obstacleX: number,
  obstacleWidth: number,
  gapCenterY: number,
): Coin {
  return {
    x: obstacleX + obstacleWidth / 2,
    y: gapCenterY,
    radius: COIN_RADIUS,
    collected: false,
    spinAngle: 0,
  }
}

export function updateCoinSpin(coin: Coin, dt: number): Coin {
  if (coin.collected) return coin
  return {
    ...coin,
    spinAngle: coin.spinAngle + dt * 0.005,
  }
}

export function moveCoin(coin: Coin, dt: number, scrollSpeed: number): Coin {
  return {
    ...coin,
    x: coin.x - scrollSpeed * dt,
  }
}

export function checkCoinCollection(coin: Coin, bird: Bird): boolean {
  if (coin.collected) return false

  // Bird hitbox (shrunken AABB)
  const shrink = bird.hitboxShrink
  const bw = bird.width * shrink
  const bh = bird.height * shrink
  const bx = BIRD_X - bw / 2
  const by = bird.y - bh / 2

  // Coin bounding box (square around circle)
  const cx = coin.x - coin.radius
  const cy = coin.y - coin.radius
  const cw = coin.radius * 2
  const ch = coin.radius * 2

  // AABB overlap test
  return bx < cx + cw && bx + bw > cx && by < cy + ch && by + bh > cy
}

export function collectCoin(coin: Coin): Coin {
  return { ...coin, collected: true }
}
