import { CallSessionLogDto } from "@models/dto.log"

export interface ILogRepository {
   createCallSessionLog(data: { callSessionId: string; userId: string; action: string }): Promise<CallSessionLogDto>
}
