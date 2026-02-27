// Game world dimensions
export const GAME_WIDTH = 360
export const GAME_HEIGHT = 640

// Bird
export const BIRD_X = 80
export const BIRD_SIZE = 32
export const BIRD_HITBOX_SHRINK = 0.8

// Physics
export const GRAVITY = 0.0009 // px/ms² downward acceleration (0.6× earth gravity)
export const FLAP_IMPULSE = -0.45 // px/ms upward velocity on loud sound
export const HOVER_DECEL = -0.0013 // px/ms² upward acceleration on moderate volume
export const MAX_FALL_SPEED = 0.6 // px/ms terminal velocity

// Obstacles
export const SCROLL_SPEED = 0.15 // px/ms horizontal obstacle speed
export const GAP_HEIGHT = 140 // px vertical gap between top and bottom walls
export const OBSTACLE_WIDTH = 52 // px horizontal wall thickness
export const MIN_OBSTACLE_SPACING = 200 // px minimum distance between consecutive obstacles
export const MIN_GAP_MARGIN = 80 // px minimum distance from gap center to screen edges

// Coins
export const COIN_RADIUS = 12 // px collision and visual radius

// Fixed timestep
export const PHYSICS_TIMESTEP = 16.667 // ms per physics step
export const MAX_FRAME_DELTA = 250 // ms maximum frame delta before clamping
export const MAX_PHYSICS_STEPS = 5 // maximum physics steps per frame

// Audio
export const CALIBRATION_DURATION = 1500 // ms ambient noise sampling time
export const VOLUME_SMOOTHING = 0.3 // exponential smoothing alpha factor
