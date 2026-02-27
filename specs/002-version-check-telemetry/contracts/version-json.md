# Contract: version.json

**Type**: Static file contract (build output → runtime fetch)  
**Producer**: Vite build plugin (`versionJsonPlugin`)  
**Consumer**: `versionService.ts` → `useVersionCheck` hook

## Schema

```json
{
  "buildTime": 1740700000000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `buildTime` | `number` | Yes | Epoch milliseconds (UTC) when `vite build` was executed |

## Location

- **Build output**: `dist/version.json`
- **Runtime URL**: `/version.json` (served by Azure Static Web Apps from the `dist/` root)

## Fetch Contract

- **Method**: `GET /version.json?t=<cache_buster>`
- **Cache**: `no-store` (request option) + query parameter cache buster
- **Timeout**: 3 seconds (AbortController)
- **Success response**: HTTP 200 with `Content-Type: application/json`
- **Failure handling**: Any non-200 status, network error, timeout, or JSON parse failure returns `null` silently

## Comparison Logic

```
if (remote.buildTime > __BUILD_TIME__) → update available
if (remote.buildTime <= __BUILD_TIME__) → no update
if (fetch returns null) → no update (fail-open)
```
