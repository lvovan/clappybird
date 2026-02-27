# Tasks: Version Check & Telemetry

**Input**: Design documents from `/specs/002-version-check-telemetry/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested — no automated test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type declarations and development placeholders needed before story implementation

- [x] T001 [P] Create `__BUILD_TIME__` global type declaration in src/types/globals.d.ts
- [x] T002 [P] Create `window.clarity` type declaration in src/types/clarity.d.ts
- [x] T003 [P] Create placeholder version.json in public/version.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No blocking cross-story prerequisites identified — type declarations in Phase 1 serve both stories. All remaining dependencies are story-specific.

*No tasks in this phase. Proceed directly to User Story 1.*

**Checkpoint**: Setup complete — user story implementation can now begin

---

## Phase 3: User Story 1 — Version Freshness Check (Priority: P1) 🎯 MVP

**Goal**: On app startup, silently fetch `/version.json` and compare its `buildTime` against the compile-time `__BUILD_TIME__` constant. If a newer version is deployed, display a non-intrusive notification with a "Refresh" button. The notification auto-dismisses after 5 seconds. The check times out after 3 seconds and silently fails on any error.

**Independent Test**: Deploy a new build to Azure Static Web Apps, then open the game on a device that has the old version cached. Verify the update banner appears within seconds. Tap "Refresh" and confirm the page reloads to the latest version. Also verify: when the version matches, no prompt appears; when offline or the endpoint is unreachable, the game loads normally with no errors.

### Implementation for User Story 1

- [x] T004 [P] [US1] Configure Vite `versionJsonPlugin` (generateBundle writes dist/version.json with `{"buildTime": <epoch_ms>}`) and add `define: { __BUILD_TIME__: Date.now() }` in vite.config.ts
- [x] T005 [P] [US1] Implement `fetchVersionInfo()` with `cache: 'no-store'`, query-param cache buster, and 3-second `AbortController` timeout in src/services/versionService.ts
- [x] T006 [US1] Implement `useVersionCheck` hook — calls `fetchVersionInfo()` on mount, compares `buildTime > __BUILD_TIME__`, manages `updateAvailable`/`dismissed` state, auto-dismiss timer (5s), `dismiss()` and `refresh()` callbacks in src/hooks/useVersionCheck.ts
- [x] T007 [P] [US1] Create UpdateNotification styles (non-intrusive top banner, fade-in/out animation, refresh button, dismiss button) in src/components/ui/UpdateNotification.module.css
- [x] T008 [US1] Create `UpdateNotification` component — renders when `updateAvailable && !dismissed`, shows "A new version is available" message with "Refresh" and dismiss controls in src/components/ui/UpdateNotification.tsx
- [x] T009 [US1] Wire `useVersionCheck` hook in `App` component and render `<UpdateNotification>` overlay in src/App.tsx

**Checkpoint**: Version check is fully functional. Build output includes `dist/version.json`. App checks for updates on load, shows notification when update is available, auto-dismisses after 5s, and silently handles failures.

---

## Phase 4: User Story 2 — Usage Telemetry via Microsoft Clarity (Priority: P2)

**Goal**: Integrate Microsoft Clarity for automatic session recording, heatmaps, and behavioral data. Fire custom events at key gameplay moments — `game_started`, `calibration_complete`, `game_over` (with `final_score` tag) — so the operator can view usage metrics in the Clarity dashboard.

**Independent Test**: Set `VITE_CLARITY_PROJECT_ID` in `.env`, open the game, play through a full session (start → calibrate → play → game over → play again), then check the Clarity dashboard. Verify unique sessions are recorded, custom events appear with correct names, and `final_score` tag is attached to `game_over` events. Also verify: when the env var is unset, the game functions identically with zero console errors.

### Implementation for User Story 2

- [x] T010 [US2] Implement `clarityService` — `initClarity(projectId)` dynamically injects Clarity CDN script, `trackEvent(name)` calls `window.clarity?.('event', name)`, `setTag(key, value)` calls `window.clarity?.('set', key, value)`, gated by `projectId` presence in src/services/clarityService.ts
- [x] T011 [P] [US2] Call `initClarity(import.meta.env.VITE_CLARITY_PROJECT_ID)` on app load in src/main.tsx
- [x] T012 [P] [US2] Fire Clarity custom events at game state transitions — `trackEvent('game_started')` in `startGame()`, `trackEvent('calibration_complete')` after calibration resolves, `trackEvent('game_over')` + `setTag('final_score', String(score))` in `gameOver()` — in src/components/game/GameProvider.tsx

**Checkpoint**: Clarity is initialized on page load, fires custom events at correct moments, and degrades gracefully (no-op) when project ID is missing or script is blocked.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and cross-story verification

- [x] T013 [P] Verify production build (`npm run build`) generates dist/version.json with a valid `buildTime` field and `__BUILD_TIME__` is injected into the bundle
- [x] T014 [P] Verify app runs without errors when `VITE_CLARITY_PROJECT_ID` is unset (Clarity graceful degradation)
- [x] T015 Run quickstart.md validation scenarios end-to-end (version check + Clarity events in dev and production build)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Skipped — no cross-story blocking prerequisites
- **User Story 1 (Phase 3)**: Depends on T001 (globals.d.ts) and T003 (placeholder version.json) from Setup
- **User Story 2 (Phase 4)**: Depends on T002 (clarity.d.ts) from Setup
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 1 completes. No dependency on US2.
- **User Story 2 (P2)**: Can start after Phase 1 completes. No dependency on US1. Can run in parallel with US1.

### Within Each User Story

- Services before hooks (hooks call service functions)
- Hooks before components (components use hook return values)
- Components before wiring into App (App renders the component)
- CSS modules can be created in parallel with their component's dependencies

### Parallel Opportunities

**Phase 1**: All 3 tasks (T001, T002, T003) can run in parallel — different files, no dependencies

**Phase 3 (US1)**:
- T004 + T005 + T007 can run in parallel (vite.config.ts, versionService.ts, CSS — different files)
- T006 depends on T005 (calls fetchVersionInfo)
- T008 depends on T006 + T007 (uses hook + CSS)
- T009 depends on T006 + T008 (wires hook + component)

**Phase 4 (US2)**:
- T010 must complete first (service used by all other US2 tasks)
- T011 + T012 can run in parallel (main.tsx vs GameProvider.tsx — different files)

**Phase 5**: T013 + T014 can run in parallel; T015 runs last (full end-to-end)

---

## Parallel Example: User Story 1

```text
# Batch 1 — Launch in parallel (3 independent files):
T004: Configure Vite versionJsonPlugin and __BUILD_TIME__ define in vite.config.ts
T005: Implement fetchVersionInfo() in src/services/versionService.ts
T007: Create UpdateNotification styles in src/components/ui/UpdateNotification.module.css

# Batch 2 — After Batch 1 completes:
T006: Implement useVersionCheck hook in src/hooks/useVersionCheck.ts (needs T005)

# Batch 3 — After Batch 2 completes:
T008: Create UpdateNotification component in src/components/ui/UpdateNotification.tsx (needs T006 + T007)

# Batch 4 — After Batch 3 completes:
T009: Wire into App.tsx (needs T006 + T008)
```

## Parallel Example: User Story 2

```text
# Batch 1 — Sequential (service first):
T010: Implement clarityService in src/services/clarityService.ts

# Batch 2 — Launch in parallel (2 independent files):
T011: Call initClarity() in src/main.tsx
T012: Fire Clarity events in src/components/game/GameProvider.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 3: User Story 1 (T004–T009)
3. **STOP and VALIDATE**: Build the app, verify version.json is generated, check that stale versions see the update prompt
4. Deploy/demo if ready — version freshness check is live

### Incremental Delivery

1. Setup (Phase 1) → Type declarations and placeholders ready
2. User Story 1 (Phase 3) → Version check live → Deploy (MVP!)
3. User Story 2 (Phase 4) → Telemetry live → Deploy
4. Polish (Phase 5) → Full validation → Final deploy
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US1]/[US2] labels map tasks to specific user stories for traceability
- No automated tests generated (not requested in spec)
- `version.json` in `public/` is a dev placeholder; the Vite plugin overwrites it in `dist/` at build time
- All Clarity calls use optional chaining (`window.clarity?.()`) for graceful degradation
- `__BUILD_TIME__` is a compile-time constant — use `declare const` in globals.d.ts, not a runtime import
- Commit after each task or logical batch; stop at any checkpoint to validate independently
