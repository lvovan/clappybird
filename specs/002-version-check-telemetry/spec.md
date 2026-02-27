# Feature Specification: Version Check & Telemetry

**Feature Branch**: `002-version-check-telemetry`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: User description: "The game must first check if a new version is available online to avoid it using an older cached version. Telemetry using Microsoft Clarity is implemented. Report metrics such as number of unique users, number of games started, score, and any relevant metrics to monitor usage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Version Freshness Check (Priority: P1)

A player opens (or returns to) the Clappy Bird web app. Before the game fully loads, the app silently checks whether a newer version has been deployed. If a newer version exists, the player is prompted with a brief, non-intrusive notification that a new version is available and offered a one-tap "Refresh" action. If the player is already on the latest version, nothing happens and the game proceeds normally. The check must not block or noticeably delay the game's startup.

**Why this priority**: Stale cached versions can cause broken gameplay, missing features, or inconsistencies. Ensuring players always run the latest deployed code is the most critical operational concern—without it, telemetry data may also be unreliable since it could come from outdated code.

**Independent Test**: Deploy a new build to Azure Static Web Apps, then open the game on a device that has the old version cached. Verify the update prompt appears. Tap "Refresh" and verify the app reloads with the new version. Also verify that when no update is available, no prompt appears and startup is unaffected.

**Acceptance Scenarios**:

1. **Given** the player opens the app and a newer version has been deployed, **When** the version check completes, **Then** a non-blocking notification is displayed informing the player that an update is available with a "Refresh" button.
2. **Given** the player opens the app and the current version matches the deployed version, **When** the version check completes, **Then** no notification is shown and the game loads normally.
3. **Given** the update notification is displayed, **When** the player taps "Refresh", **Then** the page reloads and the latest version is loaded.
4. **Given** the update notification is displayed, **When** the player ignores it and taps "Start Game", **Then** the game proceeds normally on the current version without interruption.
5. **Given** the player opens the app while offline or the version check fails, **When** the check times out or errors, **Then** the game loads normally without any error message or delay.

---

### User Story 2 - Usage Telemetry via Microsoft Clarity (Priority: P2)

The game operator (developer/product owner) wants to understand how players interact with Clappy Bird. Microsoft Clarity is integrated into the app to automatically capture session recordings, heatmaps, and behavioral data. In addition, custom events are fired at key gameplay moments—game started, game over (with score), and calibration completed—so the operator can view usage metrics in the Clarity dashboard: unique users, total games played, score distribution, and session engagement.

**Why this priority**: Telemetry provides essential operational visibility. Without it, there is no data-driven way to understand player engagement, identify drop-off points, or measure the impact of gameplay changes. However, it is P2 because the game functions perfectly without it—it is an operator-facing concern.

**Independent Test**: Open the game, play through a full session (start → play → game over → play again), then check the Microsoft Clarity dashboard. Verify that unique user sessions are recorded, custom events for "game_started", "game_over" (with score), and "calibration_complete" appear, and session replays are available.

**Acceptance Scenarios**:

1. **Given** the app loads with a valid Clarity project ID configured, **When** the page finishes loading, **Then** the Clarity tracking script is initialized and begins recording the session.
2. **Given** Clarity is initialized, **When** the player starts a game (transitions from idle to calibrating/playing), **Then** a custom "game_started" event is fired to Clarity.
3. **Given** Clarity is initialized, **When** calibration completes, **Then** a custom "calibration_complete" event is fired to Clarity.
4. **Given** Clarity is initialized, **When** the game ends (game-over state), **Then** a custom "game_over" event is fired to Clarity with the final score as a custom tag.
5. **Given** no Clarity project ID is configured (environment variable is empty or missing), **When** the app loads, **Then** Clarity is not initialized and no errors are thrown—the game functions normally.
6. **Given** Clarity is initialized, **When** the operator views the Clarity dashboard, **Then** they can see unique user counts, session recordings, heatmaps, and custom event data.

---

### Edge Cases

- What happens when the version check endpoint is unreachable (network error, DNS failure)? The game must proceed normally without blocking—the version check is a best-effort enhancement.
- What happens if the browser has aggressive caching that ignores cache-busting? The version check should use a cache-busted request (e.g., query parameter with a timestamp) to ensure it always fetches the latest version metadata.
- What happens when the Clarity script fails to load (ad blocker, network issue)? The game must function identically without Clarity—no errors, no degraded experience.
- What happens when the player opens multiple tabs? Each tab independently checks for updates and initializes Clarity. Clarity handles multi-tab sessions natively.
- What happens on the very first visit (no cached version)? The version check should recognize there is no prior version and skip the notification.

## Clarifications

### Session 2026-02-27

- Q: How long should the version check fetch wait before timing out? → A: 3-second timeout (balanced, matches SC-006)
- Q: How long does the update notification persist on screen? → A: Auto-dismiss after 5 seconds, with manual dismiss available at any time
- Q: What format should the version metadata use? → A: Build timestamp (`{"buildTime": <epoch_ms>}`) with simple numeric comparison

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On app startup, the game MUST perform a background version check by fetching a version metadata file from the server and comparing it against the currently loaded version.
- **FR-002**: The version check MUST be non-blocking—it MUST NOT delay or prevent the game from loading or being playable.
- **FR-003**: If a newer version is detected, the game MUST display a non-intrusive visual notification with a "Refresh" button that, when tapped, reloads the page.
- **FR-004**: If the version check fails (network error, timeout, missing file), the game MUST silently proceed without showing any error. The version check fetch MUST time out after 3 seconds.
- **FR-005**: The version check request MUST include cache-busting to bypass browser and CDN caches.
- **FR-006**: The game MUST integrate the Microsoft Clarity tracking script, initialized with a project ID provided via environment configuration.
- **FR-007**: The game MUST fire a custom Clarity event named "game_started" when a new game session begins (player taps Start).
- **FR-008**: The game MUST fire a custom Clarity event named "game_over" when the game ends, including the final score as a custom tag.
- **FR-009**: The game MUST fire a custom Clarity event named "calibration_complete" when microphone calibration finishes.
- **FR-010**: If the Clarity project ID is not configured or the Clarity script fails to load, the game MUST function normally without errors.
- **FR-011**: The update notification MUST be dismissible—the player can ignore it and continue playing the current version. The notification MUST auto-dismiss after 5 seconds if not interacted with.

### Key Entities

- **Version Metadata**: A lightweight JSON file deployed alongside the app containing a build timestamp in epoch milliseconds (e.g., `{"buildTime": 1740700000000}`). The running app compares its embedded build timestamp against the deployed file using simple numeric inequality.
- **Clarity Session**: A Microsoft Clarity tracking session tied to a unique visitor. Captures heatmaps, session recordings, and custom events.
- **Custom Event**: A named telemetry event fired to Clarity at key gameplay moments, optionally carrying a payload (e.g., score value).

## Assumptions

- The app is hosted on Azure Static Web Apps, which serves files with standard HTTP caching. A version metadata file will be deployed alongside the app bundle on every build.
- The version identifier is a build timestamp (epoch milliseconds) injected at build time by Vite via `define` or environment variable. The version metadata file contains `{"buildTime": <epoch_ms>}` and comparison is a simple numeric inequality (deployed > running = update available).
- Microsoft Clarity is the sole telemetry tool. No other analytics services (Google Analytics, etc.) are in scope.
- The Clarity project ID is provided via the `VITE_CLARITY_PROJECT_ID` environment variable, sourced from the `.env` file generated by the CI/CD pipeline (`azure-static-web-apps-deploy.yml`), which writes it from the `VITE_CLARITY_PROJECT_ID` GitHub secret.
- The Clarity script is loaded from Microsoft's CDN (`https://www.clarity.ms/tag/`). No self-hosting of the Clarity script.
- Custom Clarity events use the `window.clarity("event", ...)` API. Custom tags use `window.clarity("set", key, value)`.
- No consent banner or cookie consent management is in scope for this feature. Clarity's data handling is assumed compliant with the operator's privacy requirements.
- The version check uses a simple JSON file fetch, not a service worker update mechanism. Service worker-based caching is out of scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When a new version is deployed, 95% of returning players see the update notification within 5 seconds of opening the app.
- **SC-002**: The version check adds less than 200 milliseconds to perceived startup time (non-blocking fetch completes in parallel).
- **SC-003**: The Clarity dashboard shows unique user sessions, session recordings, and heatmaps within 24 hours of the first deployment with Clarity enabled.
- **SC-004**: Custom events ("game_started", "game_over", "calibration_complete") appear in the Clarity dashboard with correct event names and associated score data.
- **SC-005**: When Clarity is disabled (no project ID) or blocked (ad blocker), the game loads and plays identically with zero console errors related to Clarity.
- **SC-006**: The game loads and is playable within 3 seconds even when the version check endpoint is unreachable.
