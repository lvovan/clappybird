# Feature Specification: Voice-Controlled Flappy-Style Game

**Feature Branch**: `001-voice-flappy-game`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: User description: "A 2D arcade game inspired by Flappy Bird, controlled entirely by voice input through the microphone. The player controls a bird using voice volume — loud sound makes the bird flap upward, silence lets it fall, and steady volume maintains altitude. Obstacles scroll from right to left with randomized gaps containing collectible coins. Realistic gravity simulation. Game ends on collision with walls or ground."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Play the Core Game Loop (Priority: P1)

A player opens the game on their phone or PC browser, grants microphone access, and starts a new game. The bird appears on screen and immediately begins falling under reduced gravity (0.6× earth). The player makes a loud sound into their microphone and the bird flaps upward. Walls scroll toward the bird from the right side of the screen. The player modulates their voice volume to navigate the bird through the gaps between walls, collecting coins placed in each gap. The score increments with each coin collected. When the bird hits a wall, the game ends and the final score is displayed.

**Why this priority**: This is the entire core gameplay experience. Without it, there is no game. Every other story builds on top of this loop.

**Independent Test**: Can be fully tested by opening the game, granting mic access, and playing through several obstacle gaps. Delivers the complete playable game experience.

**Acceptance Scenarios**:

1. **Given** the game is loaded and microphone permission is granted, **When** the player taps/clicks "Start", **Then** the bird appears on screen and begins falling under gravity.
2. **Given** the game is running, **When** the player makes a loud sound into the microphone, **Then** the bird moves upward with a visible flap animation.
3. **Given** the game is running, **When** the player is silent, **Then** the bird falls with increasing downward velocity (accelerated by gravity).
4. **Given** the game is running, **When** the player holds a steady moderate volume, **Then** the bird approximately maintains its current altitude.
5. **Given** walls are scrolling from right to left, **When** the bird passes through a gap, **Then** the gap position is visibly randomized compared to the previous obstacle.
6. **Given** a spinning coin is visible in the center of a gap, **When** the bird passes through the coin, **Then** the score increments by 1 and the coin disappears.
7. **Given** the bird is in flight, **When** the bird collides with the top wall, the bottom wall, or the ground, **Then** the game ends immediately and the final score is displayed.

---

### User Story 2 - Microphone Permission & Fallback (Priority: P2)

A player opens the game on a device or browser where microphone access is unavailable, denied, or the Web Speech API is not supported. The game detects this and presents a clear message explaining that voice control requires microphone access. A fallback control method (tap/click to flap) is offered so the player can still enjoy the game.

**Why this priority**: Without graceful degradation, the game is completely broken for any user who denies mic permission or uses an unsupported browser. This directly impacts reach and first impressions.

**Independent Test**: Can be tested by denying microphone permission in the browser and verifying the game still loads with tap/click controls and an informational message.

**Acceptance Scenarios**:

1. **Given** the player opens the game for the first time, **When** the game initializes, **Then** the browser's microphone permission prompt is displayed before gameplay begins.
2. **Given** the player denies microphone permission, **When** the game detects denial, **Then** a clear message explains that voice control is unavailable and tap/click control is offered as an alternative.
3. **Given** the browser does not support the Web Speech API, **When** the game loads, **Then** the game detects the absence, displays an informational banner, and defaults to tap/click controls.
4. **Given** fallback controls are active, **When** the player taps/clicks the screen, **Then** the bird flaps upward identically to the voice-activated flap.

---

### User Story 3 - Responsive Play on Smartphone and PC (Priority: P3)

A player picks up their smartphone in portrait mode and opens the game. The game fills the screen, controls are reachable, and the game canvas scales to the device. Later, the same player opens the game on a desktop PC in a wide browser window. The game adapts to the larger landscape viewport while keeping the gameplay area properly proportioned and centered.

**Why this priority**: The project constitution mandates responsive design across smartphone and PC. This story ensures the game is playable and visually correct on both form factors.

**Independent Test**: Can be tested by loading the game on a smartphone (or device simulator in portrait mode) and on a desktop browser, verifying the game layout adapts and is fully playable on each.

**Acceptance Scenarios**:

1. **Given** the game is opened on a smartphone in portrait orientation, **When** the game loads, **Then** the game canvas scales to fit the screen width with no horizontal scrolling.
2. **Given** the game is opened on a desktop browser, **When** the game loads, **Then** the game canvas is centered and proportionally sized within the viewport.
3. **Given** the player resizes the browser window during gameplay, **When** the viewport dimensions change, **Then** the game canvas re-scales without interrupting the active game session.
4. **Given** the game is displayed on a small viewport (320 px wide), **When** the player interacts with any on-screen button, **Then** all touch/click targets are at least 44 × 44 px.

---

### User Story 4 - Game Start and Game Over Screens (Priority: P4)

A player opens the game and sees a start screen with the game title, a brief instruction about voice controls, and a prominent "Start" button. After the game ends, a game-over screen shows the final score and a "Play Again" button.

**Why this priority**: Start and game-over flows frame the player experience and are necessary for repeated play, but the core game loop (P1) can technically function with minimal UI.

**Independent Test**: Can be tested by loading the game, verifying the start screen appears, playing until game over, and verifying the game-over screen appears with score and replay option.

**Acceptance Scenarios**:

1. **Given** the player opens the game, **When** the page loads, **Then** a start screen is displayed with the game title, brief voice-control instructions, and a "Start" button.
2. **Given** the start screen is visible, **When** the player taps/clicks "Start", **Then** gameplay begins immediately.
3. **Given** the game has ended, **When** the game-over screen appears, **Then** the final score (total coins collected) is prominently displayed.
4. **Given** the game-over screen is visible, **When** the player taps/clicks "Play Again", **Then** a new game session starts with the score reset to zero.

---

### Edge Cases

- What happens when the microphone picks up constant background noise (e.g., a noisy room)? The game should use a volume threshold calibrated relative to ambient noise, not an absolute value, so the bird does not perpetually flap.
- What happens when the player Alt-Tabs away or switches apps mid-game? The game should pause automatically when the browser tab loses focus and resume when focus returns.
- What happens when two obstacles overlap or spawn too close together? Obstacle spacing must enforce a minimum distance so the player always has time to react.
- What happens when the device emits audio (e.g., game sound effects) that feeds back into the microphone? The game should either suppress its own audio from affecting input or provide a mute option for game sounds.
- What happens when the player reaches an extremely high score? The game should continue indefinitely; obstacle speed and gap size may optionally increase for difficulty but must never make passage physically impossible.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The game MUST render a bird character at a fixed horizontal position on the screen that moves only vertically.
- **FR-002**: The game MUST capture microphone audio volume in real time using the browser's Web Audio API (for volume analysis) and use the volume level to control the bird's vertical movement.
- **FR-003**: A loud sound (above a configurable threshold) MUST apply an upward force to the bird, causing it to flap and rise.
- **FR-004**: Silence (below threshold) MUST result in no upward force, allowing gravity to pull the bird downward with increasing velocity.
- **FR-005**: A steady moderate volume (around threshold) MUST approximately counterbalance gravity, allowing the bird to hover.
- **FR-006**: Gravity MUST be simulated at 0.6× earth gravity: the bird's downward velocity increases over time when no upward force is applied (constant gravitational acceleration), but at a reduced rate to improve playability.
- **FR-007**: Obstacles MUST consist of paired top and bottom walls with a vertical gap between them, scrolling continuously from right to left at a consistent speed.
- **FR-008**: The vertical position of each obstacle gap MUST be randomized within playable bounds.
- **FR-009**: A spinning coin MUST be placed at the vertical center of each obstacle gap.
- **FR-010**: When the bird overlaps a coin, the coin MUST disappear and the score MUST increment by 1.
- **FR-011**: Collision between the bird and any wall (top wall, bottom wall, or ground boundary) MUST immediately end the game.
- **FR-012**: The game MUST explicitly request microphone permission from the user before gameplay begins.
- **FR-013**: If microphone permission is denied or the required audio APIs are unavailable, the game MUST provide a fallback tap/click-to-flap control.
- **FR-014**: The game MUST display a start screen with the title, brief instructions, a "Start" button, and a copyright notice ("©️ 2026 Nathan & Luc Vo Van - Built with AI") at the bottom before gameplay begins.
- **FR-015**: The game MUST display a game-over screen showing the final score and a "Play Again" button when the game ends.
- **FR-016**: The game MUST be fully playable on both smartphones (portrait, touch) and desktop PCs (landscape, mouse/keyboard) without horizontal scrolling on viewports 320 px wide and above.
- **FR-017**: The game MUST pause automatically when the browser tab loses focus and resume when focus returns.
- **FR-018**: Obstacles MUST maintain a minimum spacing distance so the player always has a reactable window between consecutive gaps.
- **FR-019**: The score display MUST be visible at all times during active gameplay.

### Key Entities

- **Bird**: The player-controlled character. Attributes: vertical position, vertical velocity, alive/dead state, hitbox dimensions.
- **Obstacle (Wall Pair)**: A pair of top and bottom walls defining a gap. Attributes: horizontal position, gap vertical center, gap height, scroll speed, passed/not-passed state.
- **Coin**: A collectible item placed in the center of an obstacle gap. Attributes: horizontal position, vertical position, collected/uncollected state, spin animation state.
- **Game Session**: A single play-through from start to game-over. Attributes: current score, game state (not-started, playing, paused, game-over), elapsed time.
- **Audio Input**: The microphone volume signal used for bird control. Attributes: current volume level, threshold value, permission status (granted, denied, unavailable).

## Assumptions

- The "voice" control is actually **volume-based** (amplitude), not speech-recognition-based. The Web Audio API (AudioContext, AnalyserNode) will be used for real-time volume detection. The Web Speech API referenced in the constitution applies at the project level for potential future features; this game feature uses only volume amplitude.
- A single fixed volume threshold separates "loud" from "silent." No dynamic calibration is included in the initial version; this can be added as a future enhancement.
- Game sounds (music, effects) are not in scope for this feature. The game is silent by default to avoid microphone feedback. Sound can be added in a later feature.
- There is no persistent high-score leaderboard in this feature. The score is shown per session only. Persistence can be added later.
- The ground is treated as a lower boundary of the game canvas; it functions the same as hitting a bottom wall (instant game over).
- Obstacle speed and gap size remain constant throughout a session (no progressive difficulty). This can be enhanced in a future feature.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A player can start and complete a full game session (start → play → game over → play again) in under 5 seconds from page load to first flap.
- **SC-002**: The bird visibly responds to voice volume changes within 100 milliseconds of the sound, providing a feeling of real-time control.
- **SC-003**: The game renders at a consistent 60 frames per second on a mid-range 2020-era smartphone without frame drops during normal gameplay.
- **SC-004**: 90% of first-time players successfully navigate through at least one obstacle gap on their first attempt, indicating intuitive controls.
- **SC-005**: The game is fully playable (all P1 acceptance scenarios pass) on both a smartphone in portrait mode and a desktop browser in landscape mode.
- **SC-006**: When microphone permission is denied, the fallback tap/click controls allow the player to complete a full game session with no loss of gameplay functionality.
- **SC-007**: No audio data from the microphone is transmitted to any remote server, verifiable by network traffic inspection during gameplay.
