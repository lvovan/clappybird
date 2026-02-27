export interface VersionInfo {
  buildTime: number
}

const VERSION_CHECK_TIMEOUT = 3_000

/**
 * Fetches the deployed version.json with cache-busting.
 * Returns `null` silently on any failure (network, timeout, parse).
 */
export async function fetchVersionInfo(): Promise<VersionInfo | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => { controller.abort() }, VERSION_CHECK_TIMEOUT)
  try {
    const response = await fetch(`/version.json?t=${String(Date.now())}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) return null
    return (await response.json()) as VersionInfo
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}
