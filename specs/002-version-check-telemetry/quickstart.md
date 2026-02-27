# Quickstart: Version Check & Telemetry

**Feature Branch**: `002-version-check-telemetry`

## Prerequisites

- Node.js 24+
- npm 10+
- A Microsoft Clarity project ID (optional — feature degrades gracefully without it)

## Setup

```bash
git checkout 002-version-check-telemetry
npm install
```

### Environment Variables

Create a `.env` file at the project root (optional for local dev):

```env
VITE_CLARITY_PROJECT_ID=your_clarity_project_id_here
```

If omitted, Clarity integration is disabled (no errors, game works normally).

## Development

```bash
npm run dev
```

**Version check in dev mode**: The version.json plugin only runs during `vite build`, so the version check fetch will get a 404 in dev and silently return no update. This is expected behavior.

**Clarity in dev**: If `VITE_CLARITY_PROJECT_ID` is set in `.env`, Clarity will initialize and record dev sessions. Remove/empty the variable to disable.

## Build

```bash
npm run build
```

This produces:
- `dist/` — standard Vite build output
- `dist/version.json` — auto-generated file containing `{"buildTime": <epoch_ms>}`
- `__BUILD_TIME__` — compile-time constant injected into the JS bundle

## Verification

### Version Check

1. Run `npm run build` → note the `buildTime` in `dist/version.json`
2. Run `npm run preview` → open the app
3. Verify no update notification appears (versions match)
4. Edit `dist/version.json` to a higher `buildTime` value
5. Refresh the page → verify the "New version available" notification appears
6. Click "Refresh" → verify page reloads
7. Disconnect network → refresh → verify no error, game loads normally

### Clarity Telemetry

1. Set `VITE_CLARITY_PROJECT_ID` in `.env` with a valid project ID
2. Run `npm run build && npm run preview`
3. Open browser DevTools Network tab → verify Clarity script loads from `clarity.ms`
4. Play a full game session (Start → play → game over)
5. Check Clarity dashboard → verify session recording, custom events (`game_started`, `calibration_complete`, `game_over`), and `final_score` tag

### Graceful Degradation

1. Remove `VITE_CLARITY_PROJECT_ID` from `.env`
2. Rebuild and run → verify zero console errors, game works identically
3. Block `clarity.ms` in DevTools → verify zero console errors

## Testing

```bash
npm test
```

Key test scenarios:
- `versionService.ts`: fetch success, fetch timeout, fetch error, JSON parse error
- `clarityService.ts`: init with project ID, init without project ID, trackEvent/setTag calls
- `useVersionCheck.ts`: update available state, auto-dismiss timer, manual dismiss
- `UpdateNotification.tsx`: renders when update available, dismiss button, refresh button

## CI/CD

The existing `azure-static-web-apps-deploy.yml` already:
1. Writes `VITE_CLARITY_PROJECT_ID` from GitHub secrets to `.env`
2. Runs `npm run build` (which now generates `version.json` and injects `__BUILD_TIME__`)
3. Deploys `dist/` to Azure Static Web Apps

No CI/CD changes are required beyond the existing workflow.
