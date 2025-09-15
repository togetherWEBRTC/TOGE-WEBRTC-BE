import { ILogRepository } from "./log.i.repository"
import { CallSessionLogDAO, LogAction } from "@models/dao.call.session.log"
import { CallSessionLogDto } from "@models/dto.log"
import { ResError, ResCode } from "@type/response.types"

export default class LogRepository implements ILogRepository {
   constructor() {}

   public async createCallSessionLog(data: { callSessionId: string; userId: string; action: string }): Promise<CallSessionLogDto> {
      if (!Object.values(LogAction).includes(data.action as LogAction)) {
         throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: `Invalid log action: ${data.action}` })
      }

      const newLogDao = await CallSessionLogDAO.create({
         callSessionId: data.callSessionId,
         userId: data.userId,
         action: data.action as LogAction,
      } as any)

      return {
         logId: String(newLogDao.logId),
         callSessionId: newLogDao.callSessionId,
         userId: newLogDao.userId,
         action: newLogDao.action,
      }
   }
}
