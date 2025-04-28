import { Server, Socket } from "socket.io"
import { WebSocketEvents } from "@type/response.types"
import { DependencyKeys } from "@di/typedi"
import { Container } from "typedi"
import SocketCallController from "@controllers/call.controller"

export const callRouter = (io: Server, socket: Socket) => {
   const callController = Container.get<SocketCallController>(DependencyKeys.SocketCallController)

   socket.on(WebSocketEvents.CALL_CHANGE_MIC, (data: any, callback) => {
      callController.changeMicState(io, socket, data, callback)
   })

   socket.on(WebSocketEvents.CALL_CHANGE_CAMERA, (data: any, callback) => {
      callController.changeCameraState(io, socket, data, callback)
   })

   socket.on(WebSocketEvents.CALL_CHANGE_HAND_RAISED, (data: any, callback) => {
      callController.changeHandRaisedState(io, socket, data, callback)
   })

   socket.on(WebSocketEvents.CHAT_SEND_CHAT_MESSAGE, (data: any, callback) => {
      callController.sendChatMessage(io, socket, data, callback)
   })
}
