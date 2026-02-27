export type GameStatus =
  | 'idle'
  | 'calibrating'
  | 'playing'
  | 'paused'
  | 'game-over'

export type AudioPermission = 'prompt' | 'granted' | 'denied' | 'unavailable'

export interface Bird {
  y: number
  velocity: number
  width: number
  height: number
  hitboxShrink: number
  alive: boolean
  flapFrame: number
}

export interface Obstacle {
  x: number
  gapCenterY: number
  gapHeight: number
  width: number
  passed: boolean
}

export interface Coin {
  x: number
  y: number
  radius: number
  collected: boolean
  spinAngle: number
}

export interface WallRect {
  x: number
  y: number
  width: number
  height: number
}

export interface GameSession {
  status: GameStatus
  score: number
  bird: Bird
  obstacles: Obstacle[]
  coins: Coin[]
  scrollSpeed: number
  elapsedTime: number
}

export interface AudioInput {
  volume: number
  smoothedVolume: number
  threshold: number
  permissionStatus: AudioPermission
  isActive: boolean
}
