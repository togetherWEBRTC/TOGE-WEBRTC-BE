import { Server } from "socket.io"
import { WebSocketEvents } from "@type/response.types"
import { roomRouter } from "@routes/room.socket.route"
import { JWTService } from "@services/token.service"
import { Container } from "typedi"
import { DependencyKeys } from "@di/typedi"
import { TokenType } from "@type/token.types"
import SocketConnectionController from "@controllers/socket.connection.controller"
import SocketRoomController from "@controllers/socket.room.controller"
import { signalRouter } from "@routes/signal.socket.route"
import { callRouter } from "@routes/call.socket.route"

export const socketRouter = (io: Server) => {
   const tokenService = Container.get<JWTService>(DependencyKeys.JWTService)
   const connectionController = Container.get<SocketConnectionController>(DependencyKeys.SocketConnectionController)
   const roomController = Container.get<SocketRoomController>(DependencyKeys.SocketRoomController)

   io.on(WebSocketEvents.CONNECT, async (socket) => {
      try {
         const token = socket.handshake.auth.accessToken
         const tokenPayload = await tokenService.decodeToken(token, TokenType.ACCESS)
         connectionController.connectUser(socket, tokenPayload)
      } catch (error) {
         console.error("❌ Client connected error:", error)
         socket.emit(WebSocketEvents.AUTH_ERROR)
      }

      socket.on("disconnect", (reason: any) => {
         roomController.cancelJoinRoom(io, socket)
         roomController.leaveRoom(io, socket)
         connectionController.disconnectUser(socket.id)
      })

      roomRouter(io, socket)
      signalRouter(io, socket)
      callRouter(io, socket)
   })
}
