export type ReportTargetContentType = "CALL" | "CHAT" | "PROFILE"

export enum ReportReasonCategory {
   TECHNICAL = "TECHNICAL", // 기술문의
   ACCOUNT = "ACCOUNT", // 계정문의
   PAYMENT = "PAYMENT", // 결제문의
   BUG_REPORT = "BUG_REPORT", // 버그신고
   FEATURE_REQUEST = "FEATURE_REQUEST", // 기능요청
   OTHER = "OTHER", // 기타
}
