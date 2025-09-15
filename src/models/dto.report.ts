export type BlockDto = {
   blockId: string
   blockerUserId: string
   blockedUserId: string
   reason?: string
   comment?: string
}

// Report 생성 후 반환될 데이터 객체
export type ReportDto = {
   reportId: string
   reporterUserId: string
   reportedUserId: string
   reportTargetType: string
   reportTargetId: string
   reasonCategory: string
   reasonDetails?: string
   status: string
}
