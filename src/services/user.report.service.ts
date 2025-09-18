import { IUserReportRepository } from "@/repositorys/user.report.i.repository"
import { BlockDto, ReportDto } from "@models/dto.report"
import { ResError, ResCode } from "@type/response.types"
import { BlockReason } from "@models/dao.block"
import { ReportTargetContentType } from "@type/report.types"

export default class UserReportService {
   constructor(private readonly userReportRepository: IUserReportRepository) {}

   private mapReportTargetType(contentType: ReportTargetContentType): string {
      const reportTargetTypeMapping = {
         CALL: "CALL_SESSION",
         CHAT: "CHAT_MESSAGE",
         PROFILE: "USER_PROFILE",
      } as const
      return reportTargetTypeMapping[contentType]
   }

   //사용자를 차단
   async blockUser(blockerUserId: string, blockedUserId: string, reason?: string, comment?: string): Promise<BlockDto> {
      if (blockerUserId === blockedUserId) {
         throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: "Cannot block yourself" })
      }
      // TODO: 이미 차단한 유저인지 확인하는 로직 추가 가능
      return this.userReportRepository.createBlock({
         blockerUserId,
         blockedUserId,
         reason,
         comment,
      })
   }

   //사용자를 신고
   async reportUser(reporterUserId: string, reportedUserId: string, reportTargetContentType: ReportTargetContentType, reportTargetId: string, reasonCategory: string, reasonDetails?: string): Promise<ReportDto> {
      if (reporterUserId === reportedUserId) {
         throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: "Cannot report yourself" })
      }

      const mappedTargetType = this.mapReportTargetType(reportTargetContentType)

      const reportResult = await this.userReportRepository.createReport({
         reporterUserId,
         reportedUserId,
         reportTargetType: mappedTargetType,
         reportTargetId,
         reasonCategory,
         reasonDetails,
      })

      if (mappedTargetType === "CALL_SESSION") {
         try {
            await this.blockUser(reporterUserId, reportedUserId, BlockReason.BY_REPORT, `report id : ${reportResult.reportId} , ${reasonCategory}`)
         } catch (error) {
         }
      }

      return reportResult
   }

   //차단한 사용자 목록을 조회
   async getBlockedUserList(userId: string): Promise<BlockDto[]> {
      return this.userReportRepository.findBlockedUsersByUserId(userId)
   }

   //사용자 차단
   async unblockUser(blockerUserId: string, blockedUserId: string): Promise<boolean> {
      const isSuccess = await this.userReportRepository.deleteBlock(blockerUserId, blockedUserId)
      if (!isSuccess) {
         throw new ResError({ code: ResCode.DATA_ERROR.code, message: "Failed to unblock user or already unblocked." })
      }
      return true
   }
}
