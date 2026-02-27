# Implementation Plan: Version Check & Telemetry

**Branch**: `002-version-check-telemetry` | **Date**: 2026-02-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-version-check-telemetry/spec.md`

## Summary

Add a non-blocking version freshness check on app startup that compares a build timestamp embedded in the app against a deployed `version.json` file, prompting the player to refresh if a newer build exists. Integrate Microsoft Clarity for session telemetry with custom events at key gameplay moments (game_started, game_over with score, calibration_complete). Both features degrade gracefully—version check silently fails after 3s timeout, Clarity is a no-op when project ID is missing or script is blocked.

## Technical Context

**Language/Version**: TypeScript ~5.9.3, React 19.2, Vite 7.3
**Primary Dependencies**: react, react-dom, @vitejs/plugin-react-swc, Microsoft Clarity (CDN script)
**Storage**: N/A (version.json is a static file served alongside the app bundle)
**Testing**: Vitest 4.0 with jsdom, @testing-library/react
**Target Platform**: Web browser (mobile + desktop), hosted on Azure Static Web Apps
**Project Type**: Single-page web application (frontend-only SPA)
**Performance Goals**: 60 fps gameplay, version check non-blocking (<200ms perceived), game playable within 3 seconds
**Constraints**: Version check timeout 3s, notification auto-dismiss 5s, zero console errors from Clarity when disabled/blocked
**Scale/Scope**: Single project, ~15 source files, 2 new services + 1 Vite plugin + 1 UI component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`constitution.md`) contains only the blank template with no project-specific principles or constraints defined. **All gates pass trivially** — no violations possible against an empty ruleset.

| Gate | Status | Notes |
|------|--------|-------|
| Principles compliance | PASS | No principles defined in constitution |
| Constraints compliance | PASS | No constraints defined in constitution |
| Governance compliance | PASS | No governance rules defined in constitution |

## Project Structure

### Documentation (this feature)

```text
specs/002-version-check-telemetry/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx
│   │   └── GameProvider.tsx
│   ├── screens/
│   │   ├── StartScreen.tsx
│   │   └── GameOverScreen.tsx
│   └── ui/
│       ├── UpdateNotification.tsx       # NEW: version update prompt
│       ├── UpdateNotification.module.css # NEW: styles for update prompt
│       ├── ScoreDisplay.tsx
│       ├── VolumeIndicator.tsx
│       └── FallbackNotice.tsx
├── hooks/
│   ├── useVersionCheck.ts              # NEW: version check hook
│   ├── useGameLoop.ts
│   ├── useGameState.ts
│   └── useAudioInput.ts
├── models/
│   └── constants.ts
├── services/
│   ├── clarityService.ts               # NEW: Clarity init + custom events
│   ├── versionService.ts               # NEW: fetch & compare version
│   └── audioService.ts
├── App.tsx                              # MODIFIED: wire version check + Clarity events
├── main.tsx                             # MODIFIED: init Clarity on load
└── index.css
public/
└── version.json                        # NEW: generated at build time (template, overwritten)
vite.config.ts                          # MODIFIED: add build timestamp plugin
index.html                              # MODIFIED: (only if Clarity script injected here)
```

**Structure Decision**: Single project SPA. New files follow existing conventions — services in `src/services/`, hooks in `src/hooks/`, UI in `src/components/ui/`. Vite config extended with a small plugin to generate `version.json` at build time.

## Complexity Tracking

No constitution violations to justify — constitution is an empty template.
