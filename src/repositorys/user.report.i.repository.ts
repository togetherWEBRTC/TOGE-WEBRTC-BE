import { BlockReason } from "@models/dao.block"
import { ReportTargetType } from "@models/dao.report"
import { BlockDto, ReportDto } from "@models/dto.report"
import { UserInteraction } from "@type/user.info.type"

export interface IUserReportRepository {
   createBlock(data: { blockerUserId: string; blockedUserId: string; reason?: string; comment?: string }): Promise<BlockDto>
   createReport(data: { reporterUserId: string; reportedUserId: string; reportTargetType: string; reportTargetId: string; reasonCategory: string; reasonDetails?: string }): Promise<ReportDto>
   findBlockedUsersByUserId(userId: string): Promise<BlockDto[]>
   deleteBlock(blockerUserId: string, blockedUserId: string): Promise<boolean>
   getUserInteractionsWithParticipants(viewerUserId: string, participantUserIds: string[]): Promise<Map<string, UserInteraction>>
   createInquiry(userId: string | undefined, content: string, category: string): Promise<{ inquiryId: number }>
}
