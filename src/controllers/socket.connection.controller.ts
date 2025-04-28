import SocketConnectionService from "@services/socket.connection.service"
import { TokenPayload } from "@/type/token.types"

export default class SocketConnectionController {
   constructor(private readonly connectionService: SocketConnectionService) {}

   public connectUser = async (socket: any, payload: TokenPayload) => {
      try {
         this.connectionService.connectUser(socket, {
            userId: payload.userId,
            name: payload.nickname,
            profileUrl: payload.profileUrl,
         })
      } catch (error: any) {
         console.error(error)
      }
   }

   public disconnectUser = async (socketId: string) => {
      try {
         this.connectionService.deleteSocketUserInfo(socketId)
      } catch (error: any) {
         console.error(error)
      }
   }
}
