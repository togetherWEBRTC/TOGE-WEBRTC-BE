import { UserInfo, RoomParticipant, UserInteraction, RoomUserInteraction } from "@type/user.info.type"
import { Server, Socket } from "socket.io"
import SocketRoomService from "@services/socket.room.service"
import SocketConnectionService from "@services/socket.connection.service"
import { handleSocketError, successSocketResponse } from "@utils/socket.response.util"
import { ResCode, ResError, WebSocketEvents } from "@type/response.types"
import { z } from "zod"
import { validateSocketData } from "@utils/request.validation.util"
import LogService from "@services/log.service"
import UserReportService from "@services/user.report.service"

export default class SocketRoomController {
   constructor(private readonly roomService: SocketRoomService, private readonly connectionService: SocketConnectionService, private readonly logService: LogService, private readonly userReportService: UserReportService) {}

   /**
    * 방 생성
    * @param data { roomCode:string (optional) }
    */
   public createRoom = async (io: Server, socket: Socket, data: any, callback: Function) => {
      try {
         await this.checkAlreadyInRoom(socket)

         let roomCode
         if (data.roomCode && data.roomCode.length > 0) {
            // 넘어온 룸코드 존재하는경우 사용
            roomCode = data.roomCode
            // 룸코드가 이미 존재하는지 체크 후 있으면 에러
            if (io.sockets.adapter.rooms.has(roomCode)) {
               throw new ResError({
                  code: ResCode.ALREADY_EXISTED_ROOM.code,
                  message: ResCode.ALREADY_EXISTED_ROOM.message,
               })
            }
         } else {
            roomCode = await this.roomService.createRoomCode()
         }

         const userInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)
         this.joinRoomMember(io, roomCode, userInfo.userId, socket.id)

         console.log("📞", userInfo.userId, "CREATED ROOM :", roomCode)
         callback(successSocketResponse({ roomCode: roomCode }))
      } catch (error: any) {
         callback(handleSocketError(error))
      }
   }

   public joinRoom = async (io: Server, socket: Socket, data: any, callback: Function) => {
      try {
         await this.checkAlreadyInRoom(socket)

         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
         })
         const reqData = validateSocketData(schema, data)
         await this.checkRoomExists(io, reqData.roomCode)

         // 참여 희망 유저 정보
         const userInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)

         // 방장이 해당 유저를 차단했는지 체크
         const roomOwnerUserId = await this.roomService.getUserIdRoomOwner(reqData.roomCode)
         const userInteractions = await this.userReportService.getUserInteractionsWithParticipants(roomOwnerUserId, [userInfo.userId])
         const interaction = userInteractions.get(userInfo.userId)

         if (interaction?.blockStatus === "blocked_by_me" || interaction?.blockStatus === "mutual") {
            callback(successSocketResponse()) // 차단된 유저에게는 성공 응답을 주어 계속 대기하는 것처럼 보이게 함
            return
         }

         // 웨이팅리스트에 유저 추가
         await this.roomService.addJoinRoomWaiting(reqData.roomCode, userInfo.userId)
         await this.roomService.updateWaitingRoomCodeToUserInfo(userInfo.userId, reqData.roomCode)

         // 방장에게 현재 대기자 리스트 전달
         const waitingList = await this.roomService.getRoomRequestJoinWaitingList(reqData.roomCode)
         const roomOwnerSocketId = await this.roomService.getRoomOwnerSocketId(reqData.roomCode)
         await this.emitRoomNotifyWaitToRoomOwner(io, roomOwnerSocketId, waitingList, true, {
            userId: userInfo.userId,
            name: userInfo.name,
            profileUrl: userInfo.profileUrl,
         })

         callback(successSocketResponse())
      } catch (error: any) {
         callback(handleSocketError(error))
      }
   }

   public cancelJoinRoom = async (io: Server, socket: Socket) => {
      try {
         await this.checkAlreadyInRoom(socket)
         const socketUserInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)
         if (!socketUserInfo.roomWaitingCode) {
            throw new Error("Don't have waiting room")
         }
         const roomCode = socketUserInfo.roomWaitingCode
         await this.checkRoomExists(io, roomCode)
         const roomOwnerSocketId = await this.roomService.getRoomOwnerSocketId(roomCode)

         // 대기자 리스트에서 제거
         await this.roomService.removeUserIdInWaitingRoomList(roomCode, socketUserInfo.userId)
         await this.roomService.removeWaitingRoomCodeToUserInfo(socketUserInfo.userId)

         // 방장에게 갱신 된 웨이팅 리스트 전달
         await this.emitRoomNotifyWaitToRoomOwner(io, roomOwnerSocketId, await this.roomService.getRoomRequestJoinWaitingList(roomCode), false, {
            userId: socketUserInfo.userId,
            name: socketUserInfo.name,
            profileUrl: socketUserInfo.profileUrl,
         })
      } catch (error: any) {
         console.error(error)
      }
   }

   public decideJoinRoom = async (io: Server, socket: Socket, data: any, callback: Function) => {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
            userId: z.string({ message: "userId is required" }),
            isApprove: z.boolean({ message: "isApprove is required" }),
         })
         const reqData = validateSocketData(schema, data)
         const targetUserInfo = await this.connectionService.getSocketUserInfoByUserId(reqData.userId)

         // 방장인지 체크
         const roomOwnerSocketId = await this.roomService.getRoomOwnerSocketId(reqData.roomCode)
         await this.checkIsRoomOwner(socket.id, roomOwnerSocketId)

         // 대기자 리스트에서 제거
         await this.roomService.removeUserIdInWaitingRoomList(reqData.roomCode, targetUserInfo.userId)
         await this.roomService.removeWaitingRoomCodeToUserInfo(targetUserInfo.userId)

         if (reqData.isApprove) {
            //승인인 경우 룸추가
            await this.joinRoomMember(io, reqData.roomCode, targetUserInfo.userId, targetUserInfo.socketId)

            // 이미 방에 존재하는 인원에게 새 참여자 추가해서 변경된 참여자 리스트 전달
            const roomParticipants = await this.roomService.getRoomMemberList(reqData.roomCode)
            await this.emitRoomNotifyUpdateParticipant(io, reqData.roomCode, roomParticipants, reqData.isApprove, {
               userId: targetUserInfo.userId,
               name: targetUserInfo.name,
               profileUrl: targetUserInfo.profileUrl,
            })
         }

         // 방장에게 갱신 된 웨이팅 리스트 전달
         await this.emitRoomNotifyWaitToRoomOwner(io, roomOwnerSocketId, await this.roomService.getRoomRequestJoinWaitingList(reqData.roomCode), false, {
            userId: targetUserInfo.userId,
            name: targetUserInfo.name,
            profileUrl: targetUserInfo.profileUrl,
         })

         // 유저에게 결과 전달
         io.to(targetUserInfo.socketId).emit(WebSocketEvents.ROOM_NOTIFY_DECIDE_JOIN_FROM_HOST, {
            name: WebSocketEvents.ROOM_NOTIFY_DECIDE_JOIN_FROM_HOST,
            isApprove: reqData.isApprove,
         })

         callback(successSocketResponse())
      } catch (error: any) {
         callback(handleSocketError(error))
      }
   }

   // 맴버리스트 반환 data.includingMyself로 요청자 포함 여부 결정
   public getRoomMemberList = async (socket: Socket, data: any, callback: Function) => {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
         })
         const reqData = validateSocketData(schema, data)

         const myInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)
         await this.roomService.checkIsUserInRoom(myInfo.userId, reqData.roomCode)

         let roomMemberList: RoomParticipant[] = []
         if ("includingMyself" in data && data.includingMyself === true) {
            roomMemberList = await this.roomService.getRoomMemberList(reqData.roomCode)
         } else {
            roomMemberList = await this.roomService.getRoomMemberListWithoutMe(reqData.roomCode, myInfo.userId)
         }

         // 요청자와 다른 참여자들 간의 차단 관계 조회
         const otherParticipantIds: string[] = []
         for (const participant of roomMemberList) {
            if (participant.userId !== myInfo.userId) {
               otherParticipantIds.push(participant.userId)
            }
         }

         let userInteractions: RoomUserInteraction[] = []
         if (otherParticipantIds.length > 0) {
            const blockInteractionsMap = await this.userReportService.getUserInteractionsWithParticipants(myInfo.userId, otherParticipantIds)

            // UserInteraction을 RoomUserInteraction으로 변환
            userInteractions = Array.from(blockInteractionsMap.values())
               .filter((interaction) => interaction.blockStatus !== "none") // 차단 관계가 있는 경우만
               .map((interaction) => ({
                  targetUserId: interaction.targetUserId,
                  isContentBlocked: interaction.blockStatus !== "none",
                  isShowBlockIndicator: interaction.blockStatus === "blocked_by_me" || interaction.blockStatus === "mutual",
               }))
         }

         const responseData: any = {
            name: WebSocketEvents.ROOM_MEMBER_LIST,
            roomMemberList: roomMemberList,
         }

         // 차단 관계가 있는 경우에만 추가
         if (userInteractions.length > 0) {
            responseData.userInteractions = userInteractions
         }

         callback(successSocketResponse(responseData))
      } catch (error: any) {
         callback(handleSocketError(error))
      }
   }

   public leaveRoom = async (io: Server, socket: Socket) => {
      try {
         const socketUserInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)
         const roomCode = socketUserInfo.roomCode
         if (!roomCode) {
            throw new Error("Don't have roomCode")
         }

         this.logService.addCallSessionLog(roomCode, socketUserInfo.userId, "LEAVE")

         // 방장인지 체크
         const isRoomOwner = await this.roomService.checkIsRoomOwner(socketUserInfo.userId, roomCode)

         // 방에 남아있는 인원에게 변경된 참여자 리스트 전달
         const roomMemberList = await this.roomService.getRoomMemberList(roomCode)
         await this.emitRoomNotifyUpdateParticipant(io, roomCode, roomMemberList, false, {
            userId: socketUserInfo.userId,
            name: socketUserInfo.name,
            profileUrl: socketUserInfo.profileUrl,
         })

         // 방장인 경우 다음 유저에게 방장 알림
         if (isRoomOwner && roomMemberList.length > 0) {
            const nextOwnerSocketId = await this.roomService.getRoomOwnerSocketId(roomCode)
            io.to(nextOwnerSocketId).emit(WebSocketEvents.ROOM_NOTIFY_UPDATE_OWNER, {
               name: WebSocketEvents.ROOM_NOTIFY_UPDATE_OWNER,
               userId: roomMemberList[0].userId,
            })
         }

         // 룸 아웃 처리
         await this.roomService.leaveRoomByUserId(socketUserInfo.userId, roomCode)
         socket.leave(roomCode)
      } catch (error: any) {
         console.error(error)
      }
   }

   /**
    * 방장이 참여자 추방
    * @param io
    * @param data
    * @param callback
    */
   public expelRoomMember = async (io: Server, socket: Socket, data: any, callback: Function) => {
      try {
         const schema = z.object({
            roomCode: z.string({ message: "roomCode is required" }),
            userId: z.string({ message: "userId is required" }),
         })
         const reqData = validateSocketData(schema, data)

         const targetUserInfo = await this.connectionService.getSocketUserInfoByUserId(reqData.userId)
         const myInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)

         // 방장인지 체크
         const roomOwnerSocketId = await this.roomService.getRoomOwnerSocketId(reqData.roomCode)
         await this.checkIsRoomOwner(socket.id, roomOwnerSocketId)

         // 추방당하는 유저가 방에 있는지 체크
         await this.roomService.checkIsUserInRoom(targetUserInfo.userId, reqData.roomCode)

         // 추방당한 유저에게 추방 알림
         io.to(targetUserInfo.socketId).emit(WebSocketEvents.ROOM_NOTIFY_EXPEL, {
            name: WebSocketEvents.ROOM_NOTIFY_EXPEL,
            roomCode: reqData.roomCode,
         })

         this.logService.addCallSessionLog(reqData.roomCode, targetUserInfo.userId, "LEAVE")

         // 룸 아웃 처리
         await this.roomService.leaveRoomByUserId(targetUserInfo.userId, reqData.roomCode)
         io.sockets.sockets.get(targetUserInfo.socketId)?.leave(reqData.roomCode)

         // 방에 남아있는 인원에게 변경된 참여자 리스트 전달
         const roomMemberList = await this.roomService.getRoomMemberList(reqData.roomCode)
         await this.emitRoomNotifyUpdateParticipant(io, reqData.roomCode, roomMemberList, false, {
            userId: targetUserInfo.userId,
            name: targetUserInfo.name,
            profileUrl: targetUserInfo.profileUrl,
         })

         callback(successSocketResponse())
      } catch (error: any) {
         callback(handleSocketError(error))
      }
   }

   /**
    * 룸에 참여자 변경 알림
    * @param io
    * @param roomCode 룸코드
    * @param participants 참여자목록들
    * @param isJoined 참여 or 퇴장
    * @param changed 변경이 된 참여자 기본정보
    */
   private emitRoomNotifyUpdateParticipant = async (io: Server, roomCode: string, participants: RoomParticipant[], isJoined: boolean, changedUser: UserInfo) => {
      // 입장하는 경우에만 차단 관계 조회
      if (isJoined) {
         // 기존 참여자들의 ID 수집 (새 입장자 제외) - 한 번의 루프로 처리
         const existingParticipantIds: string[] = []
         for (const participant of participants) {
            if (participant.userId !== changedUser.userId) {
               existingParticipantIds.push(participant.userId)
            }
         }

         // 기존 참여자들과 새 입장자 간의 차단 관계를 한 번에 조회
         const blockInteractionsMap = await this.userReportService.getUserInteractionsWithParticipants(
            changedUser.userId, // 새 입장자 기준
            existingParticipantIds
         )

         // 기존 참여자들에게만 새 입장자와의 차단 관계 정보 전달
         for (const participant of participants) {
            if (participant.userId !== changedUser.userId) {
               // 해당 기존 참여자 관점에서 새 입장자와의 관계
               const relationWithNewUser = blockInteractionsMap.get(participant.userId)

               // UserInteraction을 RoomUserInteraction으로 변환
               /**
                *
                  | blockStatus   | isContentBlocked | isShowBlockIndicator |
                  |---------------|------------------|----------------------|
                  | none          | false            | false                |
                  | blocked_by_me | true             | true                 |
                  | blocking_me   | true             | false                |
                  | mutual        | true             | true                 |
                * @returns 
                */
               const convertToRoomUserInteraction = (userInteraction: UserInteraction): RoomUserInteraction => {
                  const { blockStatus } = userInteraction

                  return {
                     targetUserId: userInteraction.targetUserId,
                     isContentBlocked: blockStatus !== "none", // 차단 관계가 있으면 콘텐츠 차단
                     isShowBlockIndicator: blockStatus === "blocked_by_me" || blockStatus === "mutual", // 내가 차단한 경우만 인디케이터 표시
                  }
               }

               let roomUserInteraction: RoomUserInteraction
               if (relationWithNewUser) {
                  // 관계 방향 뒤집기: 새 입장자 기준 → 기존 참여자 기준
                  let reversedBlockStatus: "none" | "blocked_by_me" | "blocking_me" | "mutual" = "none"
                  if (relationWithNewUser.blockStatus === "blocked_by_me") {
                     reversedBlockStatus = "blocking_me" // 새입장자가 나를 차단 → 나를 차단하고 있음
                  } else if (relationWithNewUser.blockStatus === "blocking_me") {
                     reversedBlockStatus = "blocked_by_me" // 새입장자를 내가 차단 → 내가 차단함
                  } else if (relationWithNewUser.blockStatus === "mutual") {
                     reversedBlockStatus = "mutual" // 서로 차단
                  }
                  roomUserInteraction = convertToRoomUserInteraction({
                     targetUserId: changedUser.userId,
                     blockStatus: reversedBlockStatus,
                  })
               } else {
                  roomUserInteraction = convertToRoomUserInteraction({
                     targetUserId: changedUser.userId,
                     blockStatus: "none",
                  })
               }

               const emitData: any = {
                  name: WebSocketEvents.ROOM_NOTIFY_UPDATE_PARTICIPANT,
                  participants: participants,
                  isJoined: isJoined,
                  changedUser: changedUser,
               }

               // 차단 관계가 있는 경우에만 추가
               if (roomUserInteraction.isContentBlocked || roomUserInteraction.isShowBlockIndicator) {
                  emitData.joinedUserInteractionForMe = roomUserInteraction
               }

               io.to(participant.socketId).emit(WebSocketEvents.ROOM_NOTIFY_UPDATE_PARTICIPANT, emitData)
            }
         }
      } else {
         // 퇴장하는 경우는 기존 로직 (차단 관계 조회 없음)
         for (const participant of participants) {
            if (participant.userId !== changedUser.userId) {
               io.to(participant.socketId).emit(WebSocketEvents.ROOM_NOTIFY_UPDATE_PARTICIPANT, {
                  name: WebSocketEvents.ROOM_NOTIFY_UPDATE_PARTICIPANT,
                  participants: participants,
                  isJoined: isJoined,
                  changedUser: changedUser,
               })
            }
         }
      }
   }

   /**
    * 룸 오너에게 현재 남은 참여 대기자 리스트 전달
    * @param io
    * @param roomOwnerSocketId
    * @param socketUserInfos
    * @param newWaitingUserNickname
    */
   private emitRoomNotifyWaitToRoomOwner = async (io: Server, roomOwnerSocketId: string, waitingList: UserInfo[], isAdded: Boolean, updatedUserInfo: UserInfo) => {
      const emitDataToRoomOwner = {
         name: WebSocketEvents.ROOM_NOTIFY_WAIT,
         waitingList: waitingList,
         isAdded: isAdded,
         updatedUser: updatedUserInfo,
      }
      io.to(roomOwnerSocketId).emit(WebSocketEvents.ROOM_NOTIFY_WAIT, emitDataToRoomOwner)
   }

   /**
    * SocketIo 룸에 유저아이디 추가 및 룸에 유저아이디 추가
    * @param socket
    * @param roomCode
    * @param userId
    */
   private joinRoomMember = async (io: Server, roomCode: string, userId: string, socketId: string) => {
      io.sockets.sockets.get(socketId)?.join(roomCode)
      this.roomService.joinRoom(roomCode, userId)
      this.roomService.updateRoomCodeToUserInfo(userId, roomCode)
      this.logService.addCallSessionLog(roomCode, userId, "JOIN")
   }

   /**
    *  현재 참여중인 방이 존재하는지 체크
    * @param socket
    * @throws ResError - ALREADY_JOINED_ROOM
    * @returns void
    */
   private checkAlreadyInRoom = async (socket: Socket): Promise<void> => {
      if (socket.rooms.size > 1) {
         throw new ResError({
            code: ResCode.ALREADY_JOINED_ROOM.code,
            message: ResCode.ALREADY_JOINED_ROOM.message,
         })
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

   /**
    * 룸 호스트인지 파악
    * @param socketId
    * @param roomCode
    * @throws ResError - NOT_ROOM_OWNER
    */
   private checkIsRoomOwner = async (socketId: string, roomOwnerSocketId: string): Promise<void> => {
      if (socketId !== roomOwnerSocketId) {
         throw new ResError({
            code: ResCode.NOT_ROOM_OWNER.code,
            message: ResCode.NOT_ROOM_OWNER.message,
         })
      }
   }
}
