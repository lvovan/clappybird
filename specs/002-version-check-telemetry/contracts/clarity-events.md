# Contract: Clarity Custom Events

**Type**: Telemetry event contract (app → Microsoft Clarity SaaS)  
**Producer**: `clarityService.ts` functions called from `GameProvider.tsx`  
**Consumer**: Microsoft Clarity dashboard

## Events

### game_started

Fired when a new game session begins (player taps Start).

```typescript
window.clarity('event', 'game_started')
```

**Trigger**: `startGame()` in `GameProvider.tsx`  
**Tags**: None

### calibration_complete

Fired when microphone calibration finishes successfully.

```typescript
window.clarity('event', 'calibration_complete')
```

**Trigger**: After `audio.calibrate()` resolves, before `startPlaying()` in `GameProvider.tsx`  
**Tags**: None

### game_over

Fired when the game ends (bird collision with wall or ground).

```typescript
window.clarity('event', 'game_over')
window.clarity('set', 'final_score', String(score))
```

**Trigger**: `gameOver()` in `GameProvider.tsx`  
**Tags**:
| Key | Value | Type |
|-----|-------|------|
| `final_score` | Score as string (e.g., `"5"`) | `string` |

## Graceful Degradation

All calls use optional chaining (`window.clarity?.(...)`). If Clarity is not loaded (no project ID, ad blocker, network failure), calls are no-ops with no errors.
