import type { NotificationAdapter } from './types'
import { consoleNotificationAdapter } from './mock'

function resolveNotificationAdapter(): NotificationAdapter {
  const impl = process.env.ADAPTER_NOTIFICATION ?? 'console'
  switch (impl) {
    case 'console':
    case 'mock':
      return consoleNotificationAdapter
    // case 'bizmessage': return bizmessageNotificationAdapter
    default:
      console.warn(`Unknown ADAPTER_NOTIFICATION=${impl}, falling back to console`)
      return consoleNotificationAdapter
  }
}

export const notificationAdapter = resolveNotificationAdapter()
export type {
  NotificationAdapter,
  NotificationMessage,
  NotificationChannel,
  NotificationType,
  NotificationResult,
} from './types'
