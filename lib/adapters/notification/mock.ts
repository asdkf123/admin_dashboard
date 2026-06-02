import type {
  NotificationAdapter,
  NotificationMessage,
  NotificationResult,
} from './types'

/**
 * 콘솔에만 출력하는 mock. 운영 전환 시 SMS/메일/알림톡 게이트웨이 구현체로 교체.
 */
export const consoleNotificationAdapter: NotificationAdapter = {
  async send(msg: NotificationMessage): Promise<NotificationResult> {
    console.log(
      `[notify] ${msg.channel.toUpperCase()} → ${msg.to} | ${msg.type} | ${msg.subject ?? ''}`,
    )
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sentAt: new Date(),
    }
  },

  async sendBatch(messages: NotificationMessage[]): Promise<NotificationResult[]> {
    return Promise.all(messages.map(m => consoleNotificationAdapter.send(m)))
  },
}
