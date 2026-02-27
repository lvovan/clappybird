/**
 * Microsoft Clarity integration service.
 * Dynamically injects the Clarity CDN script and exposes helpers
 * for custom events and tags. All calls are no-ops when Clarity
 * is not initialized (missing project ID, ad blocker, network failure).
 */

let initialized = false

/**
 * Injects the Microsoft Clarity tracking script.
 * No-op if `projectId` is falsy or Clarity is already initialized.
 */
export function initClarity(projectId: string | undefined): void {
  if (!projectId || initialized) return
  initialized = true

  // Clarity bootstrap: creates window.clarity queue then loads the script.
  const w = window as unknown as Record<string, unknown>
  w['clarity'] =
    w['clarity'] ??
    function (...args: unknown[]) {
      const fn = w['clarity'] as { q?: unknown[][] }
      ;(fn.q = fn.q ?? []).push(args)
    }

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.clarity.ms/tag/${projectId}`
  const first = document.getElementsByTagName('script')[0]
  first.parentNode?.insertBefore(s, first)
}

/**
 * Fires a custom Clarity event. No-op if Clarity is not loaded.
 */
export function trackEvent(eventName: string): void {
  window.clarity?.('event', eventName)
}

/**
 * Sets a custom Clarity tag (key-value metadata). No-op if Clarity is not loaded.
 */
export function setTag(key: string, value: string): void {
  window.clarity?.('set', key, value)
}
