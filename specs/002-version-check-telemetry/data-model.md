# Data Model: Version Check & Telemetry

**Feature Branch**: `002-version-check-telemetry`  
**Date**: 2026-02-27

## Entities

### VersionInfo

Represents the deployed version metadata fetched from the server.

| Field | Type | Description |
|-------|------|-------------|
| `buildTime` | `number` | Epoch milliseconds when the app was built |

**Source**: Fetched from `/version.json` at runtime; generated at build time by Vite plugin.

**Validation**:
- Must be a positive integer
- Must be a valid epoch timestamp (> 0)
- Response must parse as valid JSON with a `buildTime` field

### VersionCheckResult

Represents the outcome of a version comparison.

| Field | Type | Description |
|-------|------|-------------|
| `updateAvailable` | `boolean` | `true` if deployed `buildTime` > running `__BUILD_TIME__` |
| `dismissed` | `boolean` | `true` if the player dismissed the notification |

**State transitions**:
- Initial: `{ updateAvailable: false, dismissed: false }`
- Update detected: `{ updateAvailable: true, dismissed: false }`
- Player dismisses: `{ updateAvailable: true, dismissed: true }`
- Auto-dismiss (5s): `{ updateAvailable: true, dismissed: true }`
- Player taps Refresh: triggers `window.location.reload()`, no state change

### ClarityConfig

Configuration for Microsoft Clarity initialization.

| Field | Type | Description |
|-------|------|-------------|
| `projectId` | `string \| undefined` | Clarity project ID from `VITE_CLARITY_PROJECT_ID` env var |
| `enabled` | `boolean` | `true` if `projectId` is a non-empty string |

### ClarityEvent

Custom events fired to Microsoft Clarity at gameplay moments.

| Event Name | Trigger | Custom Tags |
|------------|---------|-------------|
| `game_started` | Player taps Start (game transitions to calibrating/playing) | None |
| `calibration_complete` | Microphone calibration finishes (transition from calibrating to playing) | None |
| `game_over` | Game ends (bird collides with wall/ground) | `final_score`: string representation of score |

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `__BUILD_TIME__` | `number` (compile-time) | Epoch ms injected by Vite `define` at build time |
| `VERSION_CHECK_TIMEOUT` | `3000` | Milliseconds before version check fetch is aborted |
| `UPDATE_NOTIFICATION_DURATION` | `5000` | Milliseconds before update notification auto-dismisses |

## Relationships

```
Vite Build → generates → version.json (contains VersionInfo)
Vite Build → injects → __BUILD_TIME__ (compile-time constant)
App Startup → fetches → version.json → compares → __BUILD_TIME__ → VersionCheckResult
App Startup → reads → VITE_CLARITY_PROJECT_ID → ClarityConfig
GameProvider → fires → ClarityEvent at state transitions
```

## Integration Points

### Existing Code Modified

| File | Change |
|------|--------|
| `vite.config.ts` | Add `define` for `__BUILD_TIME__`, add `versionJsonPlugin()` |
| `src/main.tsx` | Call `initClarity()` on load |
| `src/App.tsx` | Wire `useVersionCheck` hook, render `UpdateNotification`, fire Clarity events at game state transitions |
| `src/components/game/GameProvider.tsx` | Fire `trackEvent` calls at `startGame`, `startPlaying` (after calibration), and `gameOver` |

### New Files

| File | Purpose |
|------|---------|
| `src/services/versionService.ts` | `fetchVersionInfo()` — cache-busted fetch with 3s timeout |
| `src/services/clarityService.ts` | `initClarity()`, `trackEvent()`, `setTag()` |
| `src/hooks/useVersionCheck.ts` | React hook managing version check state + auto-dismiss timer |
| `src/components/ui/UpdateNotification.tsx` | Non-intrusive update banner UI |
| `src/components/ui/UpdateNotification.module.css` | Styles for update banner |
| `src/types/clarity.d.ts` | TypeScript declarations for `window.clarity` |
| `src/types/globals.d.ts` | TypeScript declaration for `__BUILD_TIME__` |
