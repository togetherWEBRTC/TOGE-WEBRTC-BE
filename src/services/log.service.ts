import { ILogRepository } from "@repositorys/log.i.repository"
import { CallSessionLogDto } from "@models/dto.log"

export default class LogService {
   constructor(private readonly logRepository: ILogRepository) {}

   async addCallSessionLog(callSessionId: string, userId: string, action: string): Promise<void> {
      this.logRepository
         .createCallSessionLog({
            callSessionId,
            userId,
            action,
         })
         .catch((error) => {
            console.error("Error writing call session log:", error)
         })
   }
}
