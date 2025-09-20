import { Server } from "socket.io"
import { Container } from "typedi"
import { DependencyKeys } from "@di/typedi"
import GlobalEventService from "@services/global.event.service"
import { WebSocketEvents } from "@type/response.types"
import SocketBlockController from "@controllers/socket.block.controller"

export const socketGlobalEventRoute = (io: Server) => {
   const globalEventService = Container.get<GlobalEventService>(DependencyKeys.GlobalEventService)
   const blockController = Container.get<SocketBlockController>(DependencyKeys.SocketBlockController)

   globalEventService.on("socket_event", (payload: { eventName: string; data: any }) => {
      const { eventName, data } = payload

      if (eventName === WebSocketEvents.USER_BLOCKED) {
         blockController.handleUserBlocked(io, data)
      }
   })
}
