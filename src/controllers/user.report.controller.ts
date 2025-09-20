import { Request, Response } from "express"
import UserReportService from "@services/user.report.service"
import { successResponse, handleError } from "@utils/response.util"
import { ResCode, ResError, WebSocketEvents } from "@type/response.types"
import { validateQuery } from "@utils/request.validation.util"
import { z } from "zod"
import GlobalEventService from "@services/global.event.service"

export default class UserReportController {
   constructor(private readonly userReportService: UserReportService, private readonly globalEventService: GlobalEventService) {}

   public blockUser = async (req: Request, res: Response): Promise<void> => {
      try {
         const tokenPayload = req.tokenPayload
         if (!tokenPayload) {
            throw new ResError({ code: ResCode.INVAILD_ACCESS_TOKEN.code, message: "Token payload is missing" })
         }

         const query = z.object({
            blockedUserId: z.string({ message: "blockedUserId is required" }),
            comment: z.string().optional(),
         })
         const data = validateQuery(query, req, res)

         const result = await this.requestBlockUser(tokenPayload.userId, data.blockedUserId, "MANUAL", data.comment || "", "")

         successResponse(res, ResCode.SUCCESS.message, { blockInfo: result })
      } catch (error) {
         handleError(res, error)
      }
   }

   public unblockUser = async (req: Request, res: Response): Promise<void> => {
      try {
         const tokenPayload = req.tokenPayload
         if (!tokenPayload) {
            throw new ResError({ code: ResCode.INVAILD_ACCESS_TOKEN.code, message: "Token payload is missing" })
         }

         const query = z.object({
            blockedUserId: z.string({ message: "blockedUserId is required" }),
         })
         const data = validateQuery(query, req, res)

         await this.userReportService.unblockUser(tokenPayload.userId, data.blockedUserId)
         successResponse(res, ResCode.SUCCESS.message)
      } catch (error) {
         handleError(res, error)
      }
   }

   public getBlockedUsers = async (req: Request, res: Response): Promise<void> => {
      try {
         const tokenPayload = req.tokenPayload
         if (!tokenPayload) {
            throw new ResError({ code: ResCode.INVAILD_ACCESS_TOKEN.code, message: "Token payload is missing" })
         }

         const blockedList = await this.userReportService.getBlockedUserList(tokenPayload.userId)
         successResponse(res, ResCode.SUCCESS.message, { blockedUsers: blockedList })
      } catch (error) {
         handleError(res, error)
      }
   }

   public reportUser = async (req: Request, res: Response): Promise<void> => {
      try {
         const tokenPayload = req.tokenPayload
         if (!tokenPayload) {
            throw new ResError({ code: ResCode.INVAILD_ACCESS_TOKEN.code, message: "Token payload is missing" })
         }

         const query = z.object({
            reportedUserId: z.string({ message: "reportedUserId is required" }),
            reportTargetContentType: z.enum(["CALL", "CHAT", "PROFILE"], {
               message: "reportTargetType must be one of: CALL, CHAT, PROFILE",
            }),
            reportTargetContentId: z.string({ message: "reportTargetId is required" }), //room number / chat content
            reasonCategory: z.string({ message: "reasonCategory is required" }),
            reasonDetails: z.string().optional(),
         })
         const data = validateQuery(query, req, res)

         const combinedTargetId = `${data.reportTargetContentType}-${data.reportTargetContentId}`

         const result = await this.userReportService.reportUser(tokenPayload.userId, data.reportedUserId, data.reportTargetContentType, combinedTargetId, data.reasonCategory, data.reasonDetails)

         if (data.reportTargetContentType === "CALL") {
            await this.requestBlockUser(tokenPayload.userId, data.reportedUserId, "BY_REPORT", `REPORT_id: ${result.reportId}`, data.reportTargetContentId)
         }

         successResponse(res, ResCode.SUCCESS.message, { reportInfo: result })
      } catch (error) {
         handleError(res, error)
      }
   }

   private async requestBlockUser(blockerUserId: string, blockedUserId: string, reason: string, comment: string, roomcode: string) {
      try {
         // 차단 처리
         const result = await this.userReportService.blockUser(blockerUserId, blockedUserId, reason, comment)

         this.globalEventService.triggerSocketEvent(WebSocketEvents.USER_BLOCKED, {
            blockerUserId,
            blockedUserId,
            roomcode,
         })

         return result
      } catch (error) {
         console.error("❌ Error blocking user:", error)
         throw error
      }
   }
}
