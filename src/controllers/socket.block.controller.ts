import { Server } from "socket.io"
import { WebSocketEvents } from "@type/response.types"
import SocketConnectionService from "@services/socket.connection.service"

export default class SocketBlockController {
   constructor(private readonly connectionService: SocketConnectionService) {}

   public handleUserBlocked = async (io: Server, data: any) => {
      try {
         const { blockerUserId, blockedUserId } = data

         // 차단당한 사용자에게 알림
         try {
            const blockedUserInfo = await this.connectionService.getSocketUserInfoByUserId(blockedUserId)
            if (blockedUserInfo?.socketId) {
               io.to(blockedUserInfo.socketId).emit(WebSocketEvents.CALL_CONTENTS_BLOCK, {
                  name: "call_contents_block",
                  contentsBlockUserId: blockerUserId,
                  isShowBlockIndicator: false,
               })
            }
         } catch (error) {}

         // 차단한 사용자에게 알림
         try {
            const blockerUserInfo = await this.connectionService.getSocketUserInfoByUserId(blockerUserId)
            if (blockerUserInfo?.socketId) {
               io.to(blockerUserInfo.socketId).emit(WebSocketEvents.CALL_CONTENTS_BLOCK, {
                  name: "call_contents_block",
                  contentsBlockUserId: blockedUserId,
                  isShowBlockIndicator: true, // 클라에서 별도 차단 표시를 해줘야하는경우
               })
            }
         } catch (error) {}
      } catch (error) {
         console.error("❌ Error handling user blocked:", error)
      }
   }
}
