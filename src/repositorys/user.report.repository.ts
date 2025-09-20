import { IUserReportRepository } from "@/repositorys/user.report.i.repository"
import { BlockDAO, BlockReason } from "@models/dao.block"
import { ReportDAO, ReportStatus, ReportTargetType } from "@models/dao.report"
import { BlockDto, ReportDto } from "@models/dto.report"
import { ResError, ResCode } from "@type/response.types"
import { UserInteraction } from "@type/user.info.type"
import { Op } from "sequelize"

export default class UserReportRepository implements IUserReportRepository {
   constructor() {}

   public async createBlock(data: { blockerUserId: string; blockedUserId: string; reason?: string; comment?: string }): Promise<BlockDto> {
      if (data.reason && !Object.values(BlockReason).includes(data.reason as BlockReason)) {
         throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: `Report_REPO Invalid block reason: ${data.reason}` })
      }

      const newBlockDao = await BlockDAO.create({
         blockerUserId: data.blockerUserId,
         blockedUserId: data.blockedUserId,
         reason: data.reason as BlockReason,
         comment: data.comment,
      } as any)

      return {
         blockId: String(newBlockDao.blockId),
         blockerUserId: newBlockDao.blockerUserId,
         blockedUserId: newBlockDao.blockedUserId,
         reason: newBlockDao.reason,
         comment: newBlockDao.comment,
      }
   }

   public async createReport(data: { reporterUserId: string; reportedUserId: string; reportTargetType: string; reportTargetId: string; reasonCategory: string; reasonDetails?: string }): Promise<ReportDto> {
      const isValidTargetType = Object.values(ReportTargetType).includes(data.reportTargetType as ReportTargetType)
      if (!isValidTargetType) {
         throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: `Report_REPO Invalid report target type: ${data.reportTargetType}` })
      }

      const newReportDao = await ReportDAO.create({
         reporterUserId: data.reporterUserId,
         reportedUserId: data.reportedUserId,
         reportTargetType: data.reportTargetType as ReportTargetType,
         reportTargetId: data.reportTargetId,
         reasonCategory: data.reasonCategory,
         reasonDetails: data.reasonDetails,
         status: ReportStatus.PENDING,
      } as any)

      return {
         reportId: String(newReportDao.reportId),
         reporterUserId: newReportDao.reporterUserId,
         reportedUserId: newReportDao.reportedUserId,
         reportTargetType: newReportDao.reportTargetType,
         reportTargetId: newReportDao.reportTargetId,
         reasonCategory: newReportDao.reasonCategory,
         reasonDetails: newReportDao.reasonDetails,
         status: newReportDao.status,
      }
   }

   public async findBlockedUsersByUserId(userId: string): Promise<BlockDto[]> {
      const blockedDaos = await BlockDAO.findAll({
         where: {
            blockerUserId: userId,
         },
      })

      return blockedDaos.map((dao) => ({
         blockId: String(dao.blockId),
         blockerUserId: dao.blockerUserId,
         blockedUserId: dao.blockedUserId,
         reason: dao.reason,
         comment: dao.comment,
      }))
   }

   public async deleteBlock(blockerUserId: string, blockedUserId: string): Promise<boolean> {
      const deletedCount = await BlockDAO.destroy({
         where: {
            blockerUserId: blockerUserId,
            blockedUserId: blockedUserId,
         },
      })

      return deletedCount > 0
   }

   /**
    * 특정 사용자와 참여자들 간의 차단 관계를 조회
    * @param viewerUserId 조회하는 사용자 ID
    * @param participantUserIds 참여자들의 사용자 ID 배열
    * @returns Map<userId, UserInteraction> - 빠른 검색을 위한 Map 형태
    */
   public async getUserInteractionsWithParticipants(viewerUserId: string, participantUserIds: string[]): Promise<Map<string, UserInteraction>> {
      const blockRelations = await BlockDAO.findAll({
         where: {
            [Op.or]: [
               { blockerUserId: viewerUserId, blockedUserId: { [Op.in]: participantUserIds } }, // 내가 차단한 사람들
               { blockerUserId: { [Op.in]: participantUserIds }, blockedUserId: viewerUserId }, // 나를 차단한 사람들
            ],
         },
         attributes: ["blockerUserId", "blockedUserId"],
      })

      const resultMap = new Map<string, UserInteraction>()

      // 모든 참여자를 'none' 상태로 초기화
      participantUserIds.forEach((userId) => {
         resultMap.set(userId, { targetUserId: userId, blockStatus: "none" })
      })

      // 차단 관계가 있는 경우만 상태 업데이트
      blockRelations.forEach((block) => {
         if (block.blockerUserId === viewerUserId) {
            // 타겟유저가 상대방을 차단한 경우
            const current = resultMap.get(block.blockedUserId)
            if (current) {
               current.blockStatus = current.blockStatus === "blocking_me" ? "mutual" : "blocked_by_me"
            }
         } else {
            // 상대방이 타겟유저를 차단한 경우
            const current = resultMap.get(block.blockerUserId)
            if (current) {
               current.blockStatus = current.blockStatus === "blocked_by_me" ? "mutual" : "blocking_me"
            }
         }
      })

      return resultMap
   }
}
