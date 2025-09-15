import { Request, Response } from "express"
import LogService from "@services/log.service"
import { successResponse, handleError } from "@utils/response.util"
import { ResCode, ResError } from "@type/response.types"
import { validateQuery } from "@utils/request.validation.util"
import { z } from "zod"

export default class LogController {
   constructor(private readonly logService: LogService) {}

   public writeCallEntryExitLog = async (req: Request, res: Response): Promise<void> => {
      try {
         const tokenPayload = req.tokenPayload
         if (!tokenPayload) {
            throw new ResError({ code: ResCode.INVAILD_ACCESS_TOKEN.code, message: "Token payload is missing" })
         }

         const query = z.object({
            callSessionId: z.string({ message: "callSessionId is required" }),
            action: z.string({ message: "action is required" }),
         })
         const data = validateQuery(query, req, res)

         await this.logService.addCallSessionLog(data.callSessionId, tokenPayload.userId, data.action)
         successResponse(res, ResCode.SUCCESS.message)
      } catch (error) {
         handleError(res, error)
      }
   }
}
