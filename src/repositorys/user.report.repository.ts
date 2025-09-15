import { IUserReportRepository } from "@/repositorys/user.report.i.repository"
import { BlockDAO, BlockReason } from "@models/dao.block"
import { ReportDAO, ReportStatus, ReportTargetType } from "@models/dao.report"
import { BlockDto, ReportDto } from "@models/dto.report"
import { ResError, ResCode } from "@type/response.types"

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
}
