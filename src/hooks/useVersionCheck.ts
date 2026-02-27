import { useEffect, useState, useCallback } from 'react'
import { fetchVersionInfo } from '../services/versionService'

const UPDATE_NOTIFICATION_DURATION = 5_000

interface UseVersionCheckResult {
  updateAvailable: boolean
  dismissed: boolean
  dismiss: () => void
  refresh: () => void
}

/**
 * Checks for a newer deployed version on mount.
 * If `remote.buildTime > __BUILD_TIME__`, sets `updateAvailable = true`.
 * Auto-dismisses the notification after 5 seconds.
 */
export function useVersionCheck(): UseVersionCheckResult {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false

    void fetchVersionInfo().then((info) => {
      if (cancelled) return
      if (info && info.buildTime > __BUILD_TIME__) {
        setUpdateAvailable(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!updateAvailable || dismissed) return

    const timer = setTimeout(() => {
      setDismissed(true)
    }, UPDATE_NOTIFICATION_DURATION)

    return () => {
      clearTimeout(timer)
    }
  }, [updateAvailable, dismissed])

  const dismiss = useCallback(() => {
    setDismissed(true)
  }, [])

  const refresh = useCallback(() => {
    window.location.reload()
  }, [])

  return { updateAvailable, dismissed, dismiss, refresh }
}
