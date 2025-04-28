import { Server, Socket } from "socket.io"
import SocketConnectionService from "@services/socket.connection.service"
import SocketRoomService from "@services/socket.room.service"
import SocketCallService from "@services/socket.call.service"
import { z } from "zod"
import { validateSocketData } from "@utils/request.validation.util"
import { handleSocketError, successSocketResponse } from "@utils/socket.response.util"
import { ResCode, ResError, WebSocketEvents } from "@type/response.types"

export default class SocketCallController {
   constructor(private readonly connectionService: SocketConnectionService, private readonly socketRoomService: SocketRoomService, private readonly socketCallService: SocketCallService) {}

   //마이크 ON/OFF 상태 변경
   public async changeMicState(io: Server, socket: Socket, data: any, callback: Function): Promise<void> {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
            isMicrophoneOn: z.boolean({ message: "isMicrophoneOn is required" }),
         })
         const reqData = validateSocketData(schema, data)
         await this.checkRoomExists(io, reqData.roomCode)

         const userInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)
         await this.socketRoomService.checkIsUserInRoom(userInfo.userId, reqData.roomCode)
         if (userInfo.isMicrophoneOn == reqData.isMicrophoneOn) {
            throw new ResError({
               code: ResCode.REQUESTED_SAME_STATE.code,
               message: ResCode.REQUESTED_SAME_STATE.message,
            })
         }

         const newUserInfo = await this.socketCallService.changeMicState(userInfo.userId, reqData.isMicrophoneOn)
         const isOwner = await this.socketRoomService.checkIsRoomOwner(newUserInfo.userId, reqData.roomCode)
         const roomMyUserInfo = await this.socketRoomService.getRoomParticipantBySocketUserInfo(newUserInfo, isOwner)

         //본인 제외한 다른 유저들에게 call_notify_change_mic 알림
         socket.to(reqData.roomCode).emit(WebSocketEvents.CALL_NOTIFY_CHANGE_MIC, {
            name: WebSocketEvents.CALL_NOTIFY_CHANGE_MIC,
            changedUserInfo: roomMyUserInfo,
            isMicrophoneOn: reqData.isMicrophoneOn,
         })

         callback(successSocketResponse())
      } catch (error) {
         callback(handleSocketError(error))
      }
   }

   //카메라 ON/OFF 상태 변경
   public async changeCameraState(io: Server, socket: Socket, data: any, callback: Function): Promise<void> {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
            isCameraOn: z.boolean({ message: "isCameraOn is required" }),
         })
         const reqData = validateSocketData(schema, data)
         await this.checkRoomExists(io, reqData.roomCode)

         const userInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)
         await this.socketRoomService.checkIsUserInRoom(userInfo.userId, reqData.roomCode)
         if (userInfo.isCameraOn == reqData.isCameraOn) {
            throw new ResError({
               code: ResCode.REQUESTED_SAME_STATE.code,
               message: ResCode.REQUESTED_SAME_STATE.message,
            })
         }

         const newUserInfo = await this.socketCallService.changeCameraState(userInfo.userId, reqData.isCameraOn)
         const isOwner = await this.socketRoomService.checkIsRoomOwner(newUserInfo.userId, reqData.roomCode)
         const roomMyUserInfo = await this.socketRoomService.getRoomParticipantBySocketUserInfo(newUserInfo, isOwner)

         //본인 제외한 다른 유저들에게 call_notify_change_camera 알림
         socket.to(reqData.roomCode).emit(WebSocketEvents.CALL_NOTIFY_CHANGE_CAMERA, {
            name: WebSocketEvents.CALL_NOTIFY_CHANGE_CAMERA,
            changedUserInfo: roomMyUserInfo,
            isCameraOn: reqData.isCameraOn,
         })

         callback(successSocketResponse())
      } catch (error) {
         callback(handleSocketError(error))
      }
   }

   //손들기 ON/OFF 상태 변경
   public async changeHandRaisedState(io: Server, socket: Socket, data: any, callback: Function): Promise<void> {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
            isHandRaised: z.boolean({ message: "isHandRaised is required" }),
         })
         const reqData = validateSocketData(schema, data)
         await this.checkRoomExists(io, reqData.roomCode)

         const userInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)
         await this.socketRoomService.checkIsUserInRoom(userInfo.userId, reqData.roomCode)
         if (userInfo.isHandRaised == reqData.isHandRaised) {
            throw new ResError({
               code: ResCode.REQUESTED_SAME_STATE.code,
               message: ResCode.REQUESTED_SAME_STATE.message,
            })
         }

         const newUserInfo = await this.socketCallService.changeHandRaisedState(userInfo.userId, reqData.isHandRaised)
         const isOwner = await this.socketRoomService.checkIsRoomOwner(newUserInfo.userId, reqData.roomCode)
         const roomMyUserInfo = await this.socketRoomService.getRoomParticipantBySocketUserInfo(newUserInfo, isOwner)
         const handRaisedUsers = await this.socketCallService.getHandRaisedUserList(reqData.roomCode)

         socket.to(reqData.roomCode).emit(WebSocketEvents.CALL_NOTIFY_CHANGE_HAND_RAISED, {
            name: WebSocketEvents.CALL_NOTIFY_CHANGE_HAND_RAISED,
            changedUserInfo: roomMyUserInfo,
            isHandRaised: reqData.isHandRaised,
            handRaisedUsers: handRaisedUsers,
         })

         callback(successSocketResponse())
      } catch (error) {
         callback(handleSocketError(error))
      }
   }

   //방안의 맴버에게 채팅메시지 전송
   public async sendChatMessage(io: Server, socket: Socket, data: any, callback: Function): Promise<void> {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
            message: z.string({ message: "message is required" }),
         })
         const reqData = validateSocketData(schema, data)
         await this.checkRoomExists(io, reqData.roomCode)

         const userInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)
         await this.socketRoomService.checkIsUserInRoom(userInfo.userId, reqData.roomCode)
         const isOwner = await this.socketRoomService.checkIsRoomOwner(userInfo.userId, reqData.roomCode)
         const roomMyUserInfo = await this.socketRoomService.getRoomParticipantBySocketUserInfo(userInfo, isOwner)
         const sendTime = Math.floor(new Date().getTime() / 1000)

         io.to(reqData.roomCode).emit(WebSocketEvents.CHAT_NOTIFY_CHAT_MESSAGE, {
            name: WebSocketEvents.CHAT_NOTIFY_CHAT_MESSAGE,
            message: reqData.message,
            sendedTime: sendTime,
            senderInfo: roomMyUserInfo,
         })

         callback(successSocketResponse())
      } catch (error) {
         callback(handleSocketError(error))
      }
   }

   /**
    * 방이 존재하는지 체크
    * @param io 소켓서버 , 찾기용
    * @param roomCode 찾고자 하는 룸 코드
    * @returns true
    * @throws ResError - ROOM_NOT_FOUND
    */
   private checkRoomExists = async (io: Server, roomCode: string): Promise<Boolean> => {
      if (io.sockets.adapter.rooms.has(roomCode)) {
         return true
      } else {
         throw new ResError({
            code: ResCode.ROOM_NOT_FOUND.code,
            message: ResCode.ROOM_NOT_FOUND.message,
         })
      }
   }
}
