import { VOLUME_SMOOTHING } from '../models/constants'

export interface AudioServiceState {
  volume: number
  smoothedVolume: number
  isActive: boolean
}

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let source: MediaStreamAudioSourceNode | null = null
let stream: MediaStream | null = null
let dataArray: Uint8Array<ArrayBuffer> | null = null

const state: AudioServiceState = {
  volume: 0,
  smoothedVolume: 0,
  isActive: false,
}

function computeRMS(data: Uint8Array<ArrayBuffer>): number {
  let sumSquares = 0
  for (let i = 0; i < data.length; i++) {
    const normalized = (data[i] - 128) / 128
    sumSquares += normalized * normalized
  }
  return Math.sqrt(sumSquares / data.length)
}

export function getVolume(): number {
  if (!analyser || !dataArray) return 0
  analyser.getByteTimeDomainData(dataArray)
  return computeRMS(dataArray)
}

export function updateSmoothedVolume(): void {
  const raw = getVolume()
  state.volume = raw
  state.smoothedVolume =
    state.smoothedVolume * (1 - VOLUME_SMOOTHING) + raw * VOLUME_SMOOTHING
}

export function getState(): AudioServiceState {
  return { ...state }
}

export function getSmoothedVolume(): number {
  return state.smoothedVolume
}

export function getRawVolume(): number {
  return state.volume
}

export async function startCapture(): Promise<
  'granted' | 'denied' | 'unavailable'
> {
  // Feature detection — runtime check even though TS considers it always defined
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'unavailable'
  }

  try {
    // Create AudioContext synchronously (iOS autoplay policy — R1.4)
    audioContext = new AudioContext({ latencyHint: 'interactive' })

    // Then async getUserMedia
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
      },
    })

    // Connect nodes: MediaStreamSource → AnalyserNode (unconnected output)
    source = audioContext.createMediaStreamSource(stream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    // Do NOT connect analyser to destination (prevents speaker feedback)

    dataArray = new Uint8Array(analyser.fftSize)
    state.isActive = true

    return 'granted'
  } catch (error: unknown) {
    // Clean up partial setup
    cleanup()

    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return 'denied'
    }
    return 'unavailable'
  }
}

export async function suspend(): Promise<void> {
  if (audioContext?.state === 'running') {
    await audioContext.suspend()
  }
}

export async function resume(): Promise<void> {
  if (audioContext?.state === 'suspended') {
    await audioContext.resume()
  }
}

export function cleanup(): void {
  state.isActive = false
  state.volume = 0
  state.smoothedVolume = 0

  if (source) {
    source.disconnect()
    source = null
  }
  if (stream) {
    stream.getTracks().forEach((t) => {
      t.stop()
    })
    stream = null
  }
  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
  analyser = null
  dataArray = null
}
