/**
 * 알림 발송 어댑터 — 이메일·SMS·카카오톡 알림톡·인앱.
 */

export type NotificationChannel = 'email' | 'sms' | 'kakao' | 'inapp'

export type NotificationType =
  | 'fault_alert'        // 충전기 장애
  | 'settlement'         // 정산일/내역
  | 'contract_expiry'    // 계약 만료 임박
  | 'inspection'         // 점검 예정
  | 'approval_result'    // 가입/클레임 승인 결과
  | 'invite'             // 초대 메시지
  | 'announcement'       // 시스템 공지

export interface NotificationMessage {
  type: NotificationType
  channel: NotificationChannel
  to: string                  // 이메일/전화번호/userId
  subject?: string            // 이메일용
  body: string
  templateId?: string         // 카카오 알림톡 템플릿 등
  variables?: Record<string, string>
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  sentAt: Date
  failureReason?: string
}

export interface NotificationAdapter {
  send(message: NotificationMessage): Promise<NotificationResult>
  sendBatch(messages: NotificationMessage[]): Promise<NotificationResult[]>
}
