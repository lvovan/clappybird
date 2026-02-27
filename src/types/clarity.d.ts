interface Window {
  clarity?: {
    (method: 'event', eventName: string): void
    (method: 'set', key: string, value: string): void
  }
}
