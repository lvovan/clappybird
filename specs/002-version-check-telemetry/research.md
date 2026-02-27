# Research: Version Check & Telemetry

**Feature Branch**: `002-version-check-telemetry`  
**Date**: 2026-02-27

## 1. Vite Build-Time Constant Injection

**Decision**: Use Vite's `define` option for a compile-time `__BUILD_TIME__` constant, plus a custom Vite plugin with `generateBundle` to emit `version.json` into the build output.

**Rationale**: `define` performs static text replacement at build time with zero runtime cost. `generateBundle` emits the file as a tracked Rollup asset, keeping the build atomic. The `version.json` is generated fresh each build and doesn't pollute the source tree.

**Alternatives considered**:
- `import.meta.env.VITE_BUILD_TIME` via `.env` — requires a pre-build script to write the env file, adds a moving part
- `writeBundle` hook with `fs.writeFileSync` — runs after bundle is sealed, file not tracked by Rollup's asset pipeline
- Static `version.json` in `public/` overwritten in CI — pollutes source tree, risk of stale file in dev

**Key pattern**:
```typescript
const buildTime = Date.now()

function versionJsonPlugin(): Plugin {
  return {
    name: 'version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildTime }),
      })
    },
  }
}

// In defineConfig:
define: { __BUILD_TIME__: JSON.stringify(buildTime) }
```

TypeScript declaration needed: `declare const __BUILD_TIME__: number`

Dev-mode note: Plugin only runs during `vite build`. In dev, version check fetch should handle 404 gracefully (returns `null`).

## 2. Microsoft Clarity JavaScript API

**Decision**: Dynamically inject the Clarity script tag from a service module, gated by `VITE_CLARITY_PROJECT_ID` environment variable. Declare `window.clarity` types in a `.d.ts` file.

**Rationale**: Dynamic injection avoids hardcoding analytics in `index.html` and allows conditional loading. Clarity's bootstrap creates `window.clarity` as a queue function — calls made before the script finishes loading are safely queued. The standard APIs are:
- `window.clarity("event", eventName)` — fire a custom event
- `window.clarity("set", key, value)` — attach metadata as a tag

**Alternatives considered**:
- NPM `clarity-js` package — that's the self-hosted data collection engine, not the hosted SaaS tag
- Hardcoded `<script>` in `index.html` — always loads, no conditional control
- React `useEffect` injection — ties analytics lifecycle to a component; service module is cleaner
- Third-party wrapper (`react-microsoft-clarity`) — extra dependency for a trivial wrapper

**Key pattern**:
```typescript
export function initClarity(projectId: string): void {
  // Clarity bootstrap snippet adapted for JS injection
  // Creates window.clarity queue, injects script from https://www.clarity.ms/tag/
}

export function trackEvent(eventName: string): void {
  window.clarity?.('event', eventName)
}

export function setTag(key: string, value: string): void {
  window.clarity?.('set', key, value)
}
```

Safe to call `trackEvent`/`setTag` even if Clarity is not initialized — optional chaining handles it.

## 3. Cache-Busted Fetch for Version Checking

**Decision**: Use `fetch` with `cache: 'no-store'` plus a cache-buster query parameter (`?t=<epoch>`), combined with `AbortController` for a 3-second timeout and silent error handling.

**Rationale**: Belt-and-suspenders approach — `cache: 'no-store'` bypasses browser HTTP cache, query-string buster defeats intermediate CDN/proxy caches. `AbortController` with `setTimeout` is the standard fetch timeout pattern. Silent `null` return on any failure (network, timeout, parse) ensures the game is never blocked.

**Alternatives considered**:
- `cache: 'no-cache'` — still allows conditional 304 requests; `no-store` is stricter
- Cache-buster only — works in practice but browser may still serve from disk cache in edge cases
- `navigator.onLine` pre-check — unreliable, try/catch handles offline already

**Key pattern**:
```typescript
export async function fetchVersionInfo(): Promise<VersionInfo | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3_000)
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}
```

## Summary

| Topic | Decision | Key API |
|-------|----------|---------|
| Build-time constants | `define` + custom `generateBundle` plugin | `__BUILD_TIME__`, `version.json` |
| Microsoft Clarity | Dynamic script injection from service module, gated by env var | `window.clarity("event"/"set", ...)` |
| Cache-busted fetch | `cache: 'no-store'` + query buster + `AbortController` timeout | `fetch()` with 3s timeout, silent `null` on failure |
