import { Server, Socket } from "socket.io"
import { WebSocketEvents } from "@type/response.types"
import { DependencyKeys } from "@di/typedi"
import { Container } from "typedi"
import SocketRoomController from "@controllers/socket.room.controller"
export const roomRouter = (io: Server, socket: Socket) => {
   const roomController = Container.get<SocketRoomController>(DependencyKeys.SocketRoomController)

   socket.on(WebSocketEvents.ROOM_CREATE, (data: any, callback) => {
      roomController.createRoom(io, socket, data, callback)
   })

   socket.on(WebSocketEvents.ROOM_REQUEST_JOIN, (data: unknown, callback) => {
      roomController.joinRoom(io, socket, data, callback)
   })

   socket.on(WebSocketEvents.ROOM_DECIDE_JOIN_FROM_HOST, (data: unknown, callback) => {
      roomController.decideJoinRoom(io, socket, data, callback)
   })

   socket.on(WebSocketEvents.ROOM_REQUEST_JOIN_CANCEL, (data: unknown, callback) => {
      roomController.cancelJoinRoom(io, socket)
   })

   socket.on(WebSocketEvents.ROOM_LEAVE, (data: unknown, callback) => {
      roomController.leaveRoom(io, socket)
   })

   socket.on(WebSocketEvents.ROOM_MEMBER_LIST, (data: unknown, callback) => {
      roomController.getRoomMemberList(socket, data, callback)
   })

   socket.on(WebSocketEvents.ROOM_MEMBER_EXPEL, (data: unknown, callback) => {
      roomController.expelRoomMember(io, socket, data, callback)
   })
}
