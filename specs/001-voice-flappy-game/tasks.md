# Tasks: Voice-Controlled Flappy-Style Game

**Input**: Design documents from `/specs/001-voice-flappy-game/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test infrastructure is configured in Setup but test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (frontend-only SPA, no backend)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the Vite project, configure tooling (ESLint, Prettier, Vitest), and create source directory structure.

- [x] T001 Scaffold Vite project with `npm create vite@latest . -- --template react-swc-ts`, install production deps (react, react-dom) and dev deps (prettier, eslint-config-prettier, vitest, jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event)
- [x] T002 [P] Configure ESLint 9 strictTypeChecked with eslint-config-prettier/flat as last config entry in eslint.config.js, set parserOptions.project to tsconfig files
- [x] T003 [P] Configure Prettier in .prettierrc, add `format` and `format:check` scripts to package.json
- [x] T004 [P] Configure Vitest with jsdom environment in vite.config.ts, create test setup file at src/test/setup.ts importing @testing-library/jest-dom/vitest, add `test` and `test:ci` scripts to package.json
- [x] T005 Create source directory structure per plan.md: src/components/game/, src/components/screens/, src/components/ui/, src/hooks/, src/models/, src/services/, tests/unit/, tests/component/, tests/integration/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define all shared TypeScript types, game constants, and pure model functions that every user story depends on. No side effects, no React — pure TypeScript modules.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 [P] Define all game constants from data-model.md constants table (GAME_WIDTH=360, GAME_HEIGHT=640, BIRD_X=80, BIRD_SIZE=32, BIRD_HITBOX_SHRINK=0.8, GRAVITY=0.0009, FLAP_IMPULSE=-0.45, HOVER_DECEL=-0.0013, MAX_FALL_SPEED=0.6, SCROLL_SPEED=0.15, GAP_HEIGHT=140, OBSTACLE_WIDTH=52, MIN_OBSTACLE_SPACING=200, MIN_GAP_MARGIN=80, COIN_RADIUS=12, PHYSICS_TIMESTEP=16.667, MAX_FRAME_DELTA=250, MAX_PHYSICS_STEPS=5, CALIBRATION_DURATION=1500, VOLUME_SMOOTHING=0.3) in src/models/constants.ts
- [x] T007 [P] Define TypeScript types and interfaces for all entities (Bird, Obstacle, Coin, GameSession, AudioInput) and union types (GameStatus: 'idle'|'calibrating'|'playing'|'paused'|'game-over', AudioPermission: 'prompt'|'granted'|'denied'|'unavailable', WallRect) in src/models/types.ts
- [x] T008 [P] Implement bird factory (createBird returning initial Bird state at BIRD_X) and update helper (updateBirdPosition applying velocity × dt, clamping y to game bounds) in src/models/bird.ts
- [x] T009 [P] Implement obstacle factory (createObstacle with randomized gapCenterY within MIN_GAP_MARGIN bounds), wall-rect derivation (getWallRects returning top and bottom WallRect), scroll update (moveObstacle subtracting scrollSpeed × dt), and off-screen check in src/models/obstacle.ts
- [x] T010 [P] Implement coin factory (createCoin positioned at obstacle gap center), spin angle update for animation, and AABB overlap collection check against bird hitbox in src/models/coin.ts
- [x] T011 Implement physics engine: applyGravity (add GRAVITY × dt to velocity), applyFlap (set velocity to FLAP_IMPULSE), applyHover (add HOVER_DECEL × dt), clampVelocity (limit to MAX_FALL_SPEED), mapVolumeToForce (three-tier: silence → gravity only, moderate → hover, loud → flap), fixedTimestepUpdate (accumulator consuming dt in PHYSICS_TIMESTEP bites, max MAX_PHYSICS_STEPS), and AABB collision detection (rectangleOverlap for bird-wall and bird-boundary checks with BIRD_HITBOX_SHRINK applied) in src/models/physics.ts

**Checkpoint**: All pure model functions complete. Can be verified with unit tests. User story implementation can now begin.

---

## Phase 3: User Story 1 — Play the Core Game Loop (Priority: P1) 🎯 MVP

**Goal**: Deliver the complete playable game: bird controlled by voice volume, scrolling obstacles with randomized gaps, collectible coins, scoring, gravity simulation, collision-triggered game over.

**Independent Test**: Open the game, grant mic access, tap Start, and play through several obstacle gaps. Bird responds to voice volume, coins increment score, collision ends game.

### Implementation for User Story 1

- [x] T012 [P] [US1] Implement audio service with AudioContext creation (latencyHint: 'interactive'), MediaStreamSource → AnalyserNode (fftSize: 256, unconnected output), getUserMedia constraints (echoCancellation: true, noiseSuppression: true, autoGainControl: false), RMS volume calculation from getByteTimeDomainData, exponential smoothing (α=VOLUME_SMOOTHING), suspend/resume for tab visibility, 3-step cleanup (disconnect → track.stop() → context.close()) in src/services/audioService.ts
- [x] T013 [P] [US1] Implement useGameState hook managing GameSession state machine (idle→calibrating→playing⇄paused→game-over→idle), score tracking (increment on coin collect, reset on restart), and full session reset (bird, obstacles, coins, elapsedTime) on transition to idle in src/hooks/useGameState.ts
- [x] T014 [US1] Implement useAudioInput hook wrapping audioService: startCapture (create AudioContext sync in user gesture, then async getUserMedia per R1.4 iOS-safe ordering), stopCapture, expose volume/smoothedVolume/permissionStatus/isActive as refs, ambient noise calibration (sample RMS for CALIBRATION_DURATION ms, set threshold to mean + 1 stddev) in src/hooks/useAudioInput.ts
- [x] T015 [US1] Implement GameProvider context component exposing gameStatus, score, isFallbackMode, startGame (triggers calibration), restartGame (resets to idle) to child components without prop drilling in src/components/game/GameProvider.tsx
- [x] T016 [US1] Implement useGameLoop hook: requestAnimationFrame cycle, read smoothedVolume from audio ref, run fixedTimestepUpdate (physics + collision per tick), spawn new obstacles at MIN_OBSTACLE_SPACING intervals, check coin collection, invoke score callback on collect, detect bird-wall/bird-boundary collision → trigger game-over, cancel rAF when gameStatus !== 'playing', pause on visibilitychange blur, resume on focus in src/hooks/useGameLoop.ts
- [x] T017 [US1] Implement GameCanvas component: single `<canvas>` element, 360×640 virtual coordinate system, DPR-aware resolution (canvas.width = GAME_WIDTH × devicePixelRatio), ctx.scale(dpr, dpr), CSS letterbox centering preserving 9:16 aspect ratio, 5-layer back-to-front rendering (solid background → obstacle wall rects → spinning coins via arc+rotation → bird rect at BIRD_X → ground line), alpha: false for opaque canvas, integer coordinates to avoid sub-pixel aliasing in src/components/game/GameCanvas.tsx
- [x] T018 [P] [US1] Implement ScoreDisplay overlay component reading score from GameProvider context, positioned top-center over canvas, large readable font, visible during 'playing' and 'game-over' states in src/components/ui/ScoreDisplay.tsx with src/components/ui/ScoreDisplay.module.css
- [x] T019 [P] [US1] Implement VolumeIndicator overlay component reading volume from useAudioInput ref, vertical bar showing current mic level + threshold line, visible during 'calibrating' and 'playing' states in src/components/ui/VolumeIndicator.tsx with src/components/ui/VolumeIndicator.module.css
- [x] T020 [US1] Add base layout styles: CSS reset (margin/padding 0, box-sizing border-box), full-viewport game container (width: 100vw, height: 100dvh, display: flex, justify-content/align-items: center, background: dark color, overflow: hidden) in src/index.css
- [x] T021 [US1] Wire up App component: render GameProvider wrapping GameCanvas + ScoreDisplay + VolumeIndicator, add minimal inline Start button (visible when idle, triggers startGame + AudioContext creation) and minimal inline game-over display (visible when game-over, shows score + restartGame button) in src/App.tsx

**Checkpoint**: At this point, the full core game loop is playable. Player can start, control bird with voice, collect coins, see score, and hit game-over. This is the MVP.

---

## Phase 4: User Story 2 — Microphone Permission & Fallback (Priority: P2)

**Goal**: Gracefully handle denied or unavailable microphone access by detecting permission state and providing tap/click-to-flap controls with an informational notice.

**Independent Test**: Deny microphone permission in browser settings, reload the game. Verify informational banner appears and tap/click makes the bird flap identically to voice input.

### Implementation for User Story 2

- [x] T022 [P] [US2] Enhance useAudioInput hook to detect permission denied (getUserMedia rejection with NotAllowedError) and API unavailable (navigator.mediaDevices undefined), set permissionStatus accordingly, expose isFallbackMode derived flag (true when denied or unavailable) in src/hooks/useAudioInput.ts
- [x] T023 [P] [US2] Add tap/click-to-flap fallback input: register pointerdown listener on canvas element when isFallbackMode is true, apply FLAP_IMPULSE to bird velocity on each tap (same physics as voice flap), remove listener when not in fallback mode in src/hooks/useGameLoop.ts
- [x] T024 [P] [US2] Implement FallbackNotice component: informational banner explaining voice control requires mic permission, displayed when isFallbackMode is true, styled with clear typography and dismissible or persistent in src/components/ui/FallbackNotice.tsx with src/components/ui/FallbackNotice.module.css
- [x] T025 [US2] Integrate FallbackNotice into App component, connect isFallbackMode from GameProvider context, ensure Start button works without mic (skips calibration, goes directly to playing) in src/App.tsx

**Checkpoint**: Game now works fully with or without microphone. Denied/unavailable mic triggers fallback mode with tap/click controls and informational notice.

---

## Phase 5: User Story 3 — Responsive Play on Smartphone and PC (Priority: P3)

**Goal**: Ensure the game adapts to any viewport — smartphone portrait, desktop landscape, mid-game resize — while maintaining playability and correct proportions.

**Independent Test**: Load the game on a smartphone in portrait mode and a desktop browser, verify canvas scales correctly on each. Resize the browser window during gameplay and confirm the canvas re-scales without interruption. Verify all buttons are at least 44×44 px on small viewports.

### Implementation for User Story 3

- [x] T026 [P] [US3] Add dynamic canvas resize handling: ResizeObserver on game container, recalculate CSS display size and DPR-scaled canvas dimensions on resize, handle orientation change events, ensure no gameplay interruption during resize in src/components/game/GameCanvas.tsx
- [x] T027 [P] [US3] Add mobile viewport fixes: meta viewport tag (width=device-width, initial-scale=1, viewport-fit=cover) in index.html, touch-action: none on game container, -webkit-overflow-scrolling suppression, safe-area-inset padding for notched devices in src/index.css
- [x] T028 [P] [US3] Enforce minimum 44×44 px touch/click targets on all interactive buttons (Start, Play Again, any dismissible notices) across all component CSS Module files in src/components/screens/_.module.css and src/components/ui/_.module.css

**Checkpoint**: Game is fully playable on smartphones (portrait, 320px+) and desktop browsers (landscape). Canvas scales correctly on resize.

---

## Phase 6: User Story 4 — Game Start and Game Over Screens (Priority: P4)

**Goal**: Frame the player experience with a polished start screen (title, instructions, Start button) and game-over screen (final score, Play Again button).

**Independent Test**: Load the game and verify the start screen shows title + instructions + Start button. Play until game over and verify the game-over screen shows final score + Play Again. Click Play Again and verify a new session starts with score reset.

### Implementation for User Story 4

- [x] T029 [P] [US4] Implement StartScreen component: game title ("Screamy Bird"), brief voice-control instructions ("Make noise to fly! Stay quiet to fall."), prominent Start button that triggers startGame action (AudioContext creation in sync click handler per R1.4), styled as centered overlay in src/components/screens/StartScreen.tsx with src/components/screens/StartScreen.module.css
- [x] T030 [P] [US4] Implement GameOverScreen component: "Game Over" heading, final score (coins collected) displayed prominently, Play Again button triggering restartGame action, styled as centered overlay in src/components/screens/GameOverScreen.tsx with src/components/screens/GameOverScreen.module.css
- [x] T031 [US4] Replace minimal inline start/game-over controls in App with StartScreen (render when gameStatus === 'idle') and GameOverScreen (render when gameStatus === 'game-over'), ensure screen transitions are immediate with no extra animation in src/App.tsx

**Checkpoint**: Complete player flow — Start Screen → Gameplay → Game Over → Play Again — with polished UI on all screens.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and quality checks across all user stories.

- [x] T032 [P] Run ESLint across all source files (`npm run lint`) and fix any strictTypeChecked violations
- [x] T033 [P] Run Prettier across all source files (`npm run format`) and verify with `npm run format:check`
- [x] T034 [P] Verify production build succeeds (`npm run build`) and confirm bundle size < 300 KB gzip in dist/
- [x] T035 Run full quickstart.md validation: clean `npm install` → `npm run dev` → open in browser → Start → play through 3+ obstacles → game-over → Play Again → verify fallback mode by denying mic → verify mobile layout in device simulator
