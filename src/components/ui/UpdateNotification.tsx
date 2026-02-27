import styles from './UpdateNotification.module.css'

interface UpdateNotificationProps {
  onRefresh: () => void
  onDismiss: () => void
}

export function UpdateNotification({ onRefresh, onDismiss }: UpdateNotificationProps) {
  return (
    <div className={styles.banner} role="alert">
      <span>A new version is available</span>
      <button className={styles.refreshButton} onClick={onRefresh}>
        Refresh
      </button>
      <button
        className={styles.dismissButton}
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
