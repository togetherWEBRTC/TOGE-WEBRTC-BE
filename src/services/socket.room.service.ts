import { UserInfo, SocketUserInfo, RoomParticipant } from "@type/user.info.type"
import { v4 as uuidv4 } from "uuid"
import { ResCode, ResError } from "@type/response.types"
import { ISocketRepository } from "@repositorys/socket.i.repository"

export default class SocketRoomService {
   constructor(private readonly socketRepository: ISocketRepository) {}

   public createRoomCode = async (): Promise<string> => {
      return uuidv4().replace(/-/g, "").slice(0, 8)
   }

   // 룸에 맴버로 소켓아이디 추가
   public joinRoom = async (roomCode: string, userId: string): Promise<void> => {
      await this.socketRepository.addRoomMember(roomCode, userId)
   }

   // 룸의 오너의 소켓아이디 가져오기
   public getRoomOwnerSocketId = async (roomCode: string): Promise<string> => {
      const ownerUserId = await this.getUserIdRoomOwner(roomCode)

      const ownerUserInfo = await this.socketRepository.getSocketUserInfoByUserId(ownerUserId)
      if (!ownerUserInfo) {
         throw new Error(`ROOMCODE ${roomCode} does not have an owner`)
      }

      return ownerUserInfo.socketId
   }

   // 룸에 유저아이디 추가해서 순서대로 저장
   public addJoinRoomWaiting = async (roomCode: string, userId: string): Promise<void> => {
      await this.socketRepository.addRoomRequestJoinWaiting(roomCode, userId)
   }

   // 해당 룸의 입장 대기 인원 리스트 가져오기
   public getRoomRequestJoinWaitingList = async (roomCode: string): Promise<UserInfo[]> => {
      return await this.socketRepository.getJoinWaitingMembers(roomCode)
   }

   // 룸 입장 대기 리스트에서 해당 유저아이디 제거
   public removeUserIdInWaitingRoomList = async (roomCode: string, userId: string): Promise<boolean> => {
      const result = await this.socketRepository.deleteJoinRoomWaiting(roomCode, userId)
      if (result > 0) {
         return true
      } else {
         throw new Error(`Failed to remove userId ${userId} from roomCode ${roomCode}`)
      }
   }

   // 룸에 속해 있는 유저아이디 리스트 가져오기
   public getRoomMemberList = async (roomCode: string): Promise<RoomParticipant[]> => {
      return await this.socketRepository.getRoomMembers(roomCode)
   }

   //getRoomMemberList에서 자기자신 제외
   public getRoomMemberListWithoutMe = async (roomCode: string, userId: string): Promise<RoomParticipant[]> => {
      const roomMembers = await this.getRoomMemberList(roomCode)
      return roomMembers.filter((member) => member.userId !== userId)
   }

   // 유저 정보에 roomCode 추가
   public updateRoomCodeToUserInfo = async (userId: string, roomCode: string): Promise<void> => {
      await this.socketRepository.updateRoomCodeToUserInfo(userId, roomCode)
   }

   // 유저 정보에 watingRoomCode 추가
   public updateWaitingRoomCodeToUserInfo = async (userId: string, roomCode: string): Promise<void> => {
      await this.socketRepository.updateWaitingRoomCodeToUserInfo(userId, roomCode)
   }

   // 유저 정보에서 watingRoomCode 제거
   public removeWaitingRoomCodeToUserInfo = async (userId: string): Promise<void> => {
      await this.socketRepository.deleteWaitingRoomCodeToUserInfo(userId)
   }

   // 타겟 유저가 방장인지 디비 확인해서 체크
   public checkIsRoomOwner = async (userId: string, roomCode: string): Promise<boolean> => {
      return (await this.getUserIdRoomOwner(roomCode)) === userId
   }

   // 룸의 소유자 유저아이디 가져오기
   public getUserIdRoomOwner = async (roomCode: string): Promise<string> => {
      const ownerUserId = await this.socketRepository.getRoomOwnerUserIdByRoomCode(roomCode)
      if (!ownerUserId) {
         throw new Error(`ROOMCODE ${roomCode} does not have an owner`)
      }
      return ownerUserId
   }

   // 해당 유저아이디 룸에서 제외
   public leaveRoomByUserId = async (userId: string, roomCode: string): Promise<void> => {
      // 룸 맴버 디비에서 제외
      const result = await this.socketRepository.deleteRoomMember(roomCode, userId)
      if (result === 0) {
         throw new Error(`Failed to remove userId ${userId} from roomCode ${roomCode}`)
      }

      // 유저 정보에서 roomCode 제거
      await this.socketRepository.deleteRoomCodeToUserInfo(roomCode, userId)
   }

   // 해당유저 룸에 포함되어있느지 확인
   public checkIsUserInRoom = async (userId: string, roomCode: string): Promise<boolean> => {
      const roomMembers = await this.getRoomMemberList(roomCode)
      if (!roomMembers.some((member) => member.userId === userId)) {
         throw new ResError({
            code: ResCode.NOT_ROOM_MEMBER.code,
            message: ResCode.NOT_ROOM_MEMBER.message + ` userId: ${userId} roomCode: ${roomCode}`,
         })
      }
      return true
   }

   //socketUserInfo로 RoomParticipant 리턴
   public getRoomParticipantBySocketUserInfo = async (socketUserInfo: SocketUserInfo, isOwner: boolean): Promise<RoomParticipant> => {
      return {
         userId: socketUserInfo.userId,
         name: socketUserInfo.name,
         profileUrl: socketUserInfo.profileUrl,
         isOwner: isOwner,
         socketId: socketUserInfo.socketId,
         isMicrophoneOn: socketUserInfo.isMicrophoneOn,
         isCameraOn: socketUserInfo.isCameraOn,
         isHandRaised: socketUserInfo.isHandRaised,
      }
   }
}
