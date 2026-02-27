import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioPermission } from '../models/types'
import { CALIBRATION_DURATION } from '../models/constants'
import * as audioService from '../services/audioService'

export interface UseAudioInputReturn {
  volume: React.RefObject<number>
  smoothedVolume: React.RefObject<number>
  threshold: React.RefObject<number>
  permissionStatus: AudioPermission
  isActive: boolean
  isFallbackMode: boolean
  startCapture: () => Promise<void>
  stopCapture: () => void
  suspend: () => Promise<void>
  resume: () => Promise<void>
  calibrate: () => Promise<void>
}

export function useAudioInput(): UseAudioInputReturn {
  const [permissionStatus, setPermissionStatus] =
    useState<AudioPermission>('prompt')
  const [isActive, setIsActive] = useState(false)

  const volumeRef = useRef(0)
  const smoothedVolumeRef = useRef(0)
  const thresholdRef = useRef(0.05) // Default threshold
  const pollingRef = useRef<number | null>(null)

  const isFallbackMode =
    permissionStatus === 'denied' || permissionStatus === 'unavailable'

  // Polling loop: read volume from audio service each frame
  const startPolling = useCallback(() => {
    const poll = () => {
      audioService.updateSmoothedVolume()
      const state = audioService.getState()
      volumeRef.current = state.volume
      smoothedVolumeRef.current = state.smoothedVolume
      pollingRef.current = requestAnimationFrame(poll)
    }
    pollingRef.current = requestAnimationFrame(poll)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      cancelAnimationFrame(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startCapture = useCallback(async () => {
    const result = await audioService.startCapture()
    setPermissionStatus(result)

    if (result === 'granted') {
      setIsActive(true)
      startPolling()
    }
  }, [startPolling])

  const stopCapture = useCallback(() => {
    stopPolling()
    audioService.cleanup()
    setIsActive(false)
  }, [stopPolling])

  const suspend = useCallback(async () => {
    stopPolling()
    await audioService.suspend()
  }, [stopPolling])

  const resume = useCallback(async () => {
    await audioService.resume()
    startPolling()
  }, [startPolling])

  // Calibrate: sample ambient RMS for CALIBRATION_DURATION ms
  // Set threshold to mean + 1 stddev
  const calibrate = useCallback(() => {
    return new Promise<void>((resolve) => {
      const samples: number[] = []
      const startTime = performance.now()

      const sample = () => {
        audioService.updateSmoothedVolume()
        const vol = audioService.getRawVolume()
        samples.push(vol)

        if (performance.now() - startTime < CALIBRATION_DURATION) {
          requestAnimationFrame(sample)
        } else {
          // Calculate mean + stddev
          const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length
          const variance =
            samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
            samples.length
          const stddev = Math.sqrt(variance)

          // Threshold = mean + 1 stddev, with a minimum floor
          thresholdRef.current = Math.max(mean + stddev, 0.02)
          resolve()
        }
      }

      requestAnimationFrame(sample)
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
      audioService.cleanup()
    }
  }, [stopPolling])

  return {
    volume: volumeRef,
    smoothedVolume: smoothedVolumeRef,
    threshold: thresholdRef,
    permissionStatus,
    isActive,
    isFallbackMode,
    startCapture,
    stopCapture,
    suspend,
    resume,
    calibrate,
  }
}
