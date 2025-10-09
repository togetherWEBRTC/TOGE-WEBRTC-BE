import { Server } from "socket.io"
import { Container } from "typedi"
import { DependencyKeys } from "@di/typedi"
import GlobalEventService from "@services/global.event.service"
import { WebSocketEvents } from "@type/response.types"
import SocketBlockController from "@controllers/socket.block.controller"
import SocketConnectionController from "@controllers/socket.connection.controller"

export const socketGlobalEventRoute = (io: Server) => {
   const globalEventService = Container.get<GlobalEventService>(DependencyKeys.GlobalEventService)
   const blockController = Container.get<SocketBlockController>(DependencyKeys.SocketBlockController)
   const connectionController = Container.get<SocketConnectionController>(DependencyKeys.SocketConnectionController)

   globalEventService.on("socket_event", async (payload: { eventName: string; data: any }) => {
      const { eventName, data } = payload

      if (eventName === WebSocketEvents.USER_BLOCKED) {
         blockController.handleUserBlocked(io, data)
      }

      if (eventName === WebSocketEvents.KEY_EXPIRED) {
         console.log(`socketGlobalEventRoute / Redis key expired: ${data.expiredKey}`)

         // waiting_disconnect 키가 만료된 경우 처리
         if (data.expiredKey.startsWith("waiting_disconnect:")) {
            const userId = data.expiredKey.replace("waiting_disconnect:", "")
            console.log(`⏰ waiting_disconnect 키 만료 처리 시작: ${userId}`)

            try {
               await connectionController.processExpiredDisconnect(io, userId)
            } catch (error) {
               console.error(`❌ processExpiredDisconnect 실행 중 에러 (${userId}):`, error)
            }
         }
      }
   })
}
