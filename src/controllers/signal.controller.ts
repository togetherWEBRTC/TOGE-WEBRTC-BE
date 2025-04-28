import { UserInfo, RoomParticipant } from "@type/user.info.type"
import { Server, Socket } from "socket.io"
import { WebSocketEvents } from "@type/response.types"
import SocketConnectionService from "@services/socket.connection.service"
import SocketRoomService from "@services/socket.room.service"
import { z } from "zod"
import { validateSocketData } from "@utils/request.validation.util"
import { handleSocketError, successSocketResponse } from "@utils/socket.response.util"

export default class SocketRoomController {
   constructor(private readonly connectionService: SocketConnectionService, private readonly socketRoomService: SocketRoomService) {}

   public async sendOffer(socket: Socket, data: any, callback: Function): Promise<void> {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
            toUserId: z.string({ message: "toUserId is required" }),
            sdp: z.string({ message: "sdp is required" }),
         })
         const reqData = validateSocketData(schema, data)

         const myInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)

         //룸 맴버 검증
         await this.socketRoomService.checkIsUserInRoom(myInfo.userId, reqData.roomCode)
         await this.socketRoomService.checkIsUserInRoom(reqData.toUserId, reqData.roomCode)

         // 타겟유저에게 sdp 전달
         const targetUserInfo = await this.connectionService.getSocketUserInfoByUserId(reqData.toUserId)
         socket.to(targetUserInfo.socketId).emit(WebSocketEvents.SIGNAL_NOTIFY_OFFER, {
            name: WebSocketEvents.SIGNAL_NOTIFY_OFFER,
            fromUserId: myInfo.userId,
            sdp: reqData.sdp,
         })

         callback(successSocketResponse())
      } catch (error) {
         callback(handleSocketError(error))
      }
   }

   public async sendAnswer(socket: Socket, data: any, callback: Function): Promise<void> {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
            toUserId: z.string({ message: "toUserId is required" }),
            sdp: z.string({ message: "sdp is required" }),
         })
         const reqData = validateSocketData(schema, data)

         const myInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)

         //룸 맴버 검증
         await this.socketRoomService.checkIsUserInRoom(myInfo.userId, reqData.roomCode)
         await this.socketRoomService.checkIsUserInRoom(reqData.toUserId, reqData.roomCode)

         // 타겟유저에게 sdp 전달
         const targetUserInfo = await this.connectionService.getSocketUserInfoByUserId(reqData.toUserId)
         socket.to(targetUserInfo.socketId).emit(WebSocketEvents.SIGNAL_NOTIFY_ANSWER, {
            name: WebSocketEvents.SIGNAL_NOTIFY_ANSWER,
            fromUserId: myInfo.userId,
            sdp: reqData.sdp,
         })

         callback(successSocketResponse())
      } catch (error) {
         callback(handleSocketError(error))
      }
   }

   public async sendIce(socket: Socket, data: any, callback: Function): Promise<void> {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
            toUserId: z.string({ message: "toUserId is required" }),
            candidate: z.string({ message: "candidate is required" }),
            sdpMid: z.string({ message: "sdpMid is required" }),
            sdpMLineIndex: z.number({ message: "sdpMLineIndex is required" }),
         })
         const reqData = validateSocketData(schema, data)

         const myInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)

         //룸 맴버 검증
         await this.socketRoomService.checkIsUserInRoom(myInfo.userId, reqData.roomCode)
         await this.socketRoomService.checkIsUserInRoom(reqData.toUserId, reqData.roomCode)

         // 타겟유저에게 candidate 전달
         const targetUserInfo = await this.connectionService.getSocketUserInfoByUserId(reqData.toUserId)
         socket.to(targetUserInfo.socketId).emit(WebSocketEvents.SIGNAL_NOTIFY_ICE, {
            name: WebSocketEvents.SIGNAL_NOTIFY_ICE,
            fromUserId: myInfo.userId,
            candidate: reqData.candidate,
            sdpMid: reqData.sdpMid,
            sdpMLineIndex: reqData.sdpMLineIndex,
         })

         callback(successSocketResponse())
      } catch (error) {
         callback(handleSocketError(error))
      }
   }

   public async rtcReady(io: Server, socket: Socket, data: any, callback: Function): Promise<void> {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
         })
         const reqData = validateSocketData(schema, data)

         const myInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)

         //룸 맴버 검증
         await this.socketRoomService.checkIsUserInRoom(myInfo.userId, reqData.roomCode)

         // 룸에 있는 유저들에게 rtc 준비 완료 알림
         const roomMemberList = await this.socketRoomService.getRoomMemberList(reqData.roomCode)
         await this.emitRtcReadyToParticipants(io, WebSocketEvents.RTC_READY, roomMemberList, myInfo)

         callback(successSocketResponse())
      } catch (error) {
         callback(handleSocketError(error))
      }
   }

   /**
    * rtc 변경을 방유저들에게 알림
    */
   private emitRtcReadyToParticipants = async (io: Server, emitCode: string, participants: RoomParticipant[], exceptUser: UserInfo) => {
      for (const participant of participants) {
         if (participant.userId !== exceptUser.userId) {
            io.to(participant.socketId).emit(emitCode, {
               userId: exceptUser.userId,
            })
         }
      }
   }
}
