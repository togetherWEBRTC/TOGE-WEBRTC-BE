import { Service, Inject } from "typedi"
import dotenv from "dotenv"
import { getRedisClient } from "@config/redis"
import { UserInfo, SocketUserInfo, RoomParticipant } from "@type/user.info.type"
import { ISocketRepository } from "@repositorys/socket.i.repository"

export default class SocketRepository implements ISocketRepository {
   private readonly redisClient: any
   private readonly SOCKET_EXPIRE_TIME: number
   private readonly SOCKET_ID_PREFIX = "socket_id:"
   private readonly SOCKET_ROOM_MEMBER_PREFIX = "socket_room_member:"
   private readonly SOCKET_ROOM_REQUEST_JOIN_WAITING = "socket_room_request_join_waiting:"

   constructor() {
      dotenv.config()
      this.redisClient = getRedisClient()
      this.SOCKET_EXPIRE_TIME = parseInt(process.env.SOCKET_EXPIRE_TIME || "3600")
   }

   //소켓아이디와 유저정보 저장
   public setUserInfo = async (socketId: string, userInfo: SocketUserInfo): Promise<void> => {
      const socketKey = this.SOCKET_ID_PREFIX + socketId
      await this.redisClient.multi().set(socketKey, userInfo.userId).expire(socketKey, this.SOCKET_EXPIRE_TIME).exec()

      const userKey = this.SOCKET_ID_PREFIX + userInfo.userId
      await this.redisClient.multi().set(userKey, JSON.stringify(userInfo)).expire(userKey, this.SOCKET_EXPIRE_TIME).exec()
   }

   //룸에 유저아이디 추가해서 순서 저장
   public addRoomMember = async (roomCode: string, userId: string): Promise<void> => {
      const roomKey = this.SOCKET_ROOM_MEMBER_PREFIX + roomCode
      await this.redisClient.multi().rPush(roomKey, userId).expire(roomKey, this.SOCKET_EXPIRE_TIME).exec()
   }

   //룸 입장 웨이팅 리스트에 소켓아이디 추가해서 순서 저장
   public addRoomRequestJoinWaiting = async (roomCode: string, userId: string): Promise<void> => {
      const roomKey = this.SOCKET_ROOM_REQUEST_JOIN_WAITING + roomCode
      await this.redisClient.multi().rPush(roomKey, userId).expire(roomKey, this.SOCKET_EXPIRE_TIME).exec()
   }

   // 유저정보에 roomCode 추가
   public updateRoomCodeToUserInfo = async (userId: string, roomCode: string): Promise<void> => {
      const userInfo = await this.getSocketUserInfoByUserId(userId)
      userInfo.roomCode = roomCode
      const userKey = this.SOCKET_ID_PREFIX + userInfo.userId
      await this.redisClient.multi().set(userKey, JSON.stringify(userInfo)).expire(userKey, this.SOCKET_EXPIRE_TIME).exec()
   }

   // 유저정보에 watingRoomCode 추가
   public updateWaitingRoomCodeToUserInfo = async (userId: string, waitingRoomCode: string): Promise<void> => {
      const userInfo = await this.getSocketUserInfoByUserId(userId)
      userInfo.roomWaitingCode = waitingRoomCode
      const userKey = this.SOCKET_ID_PREFIX + userInfo.userId
      await this.redisClient.multi().set(userKey, JSON.stringify(userInfo)).expire(userKey, this.SOCKET_EXPIRE_TIME).exec()
   }

   //소켓아이디로 유저정보 가져오기
   public getSocketUserInfoBySocketId = async (socketId: string): Promise<SocketUserInfo> => {
      const userId = await this.redisClient.get(this.SOCKET_ID_PREFIX + socketId)
      return await this.getSocketUserInfoByUserId(userId)
   }

   //소켓아이디로 유저아이디 가져오기
   public getUserIdBySocketId = async (socketId: string): Promise<string> => {
      return (await this.redisClient.get(this.SOCKET_ID_PREFIX + socketId)) ?? ""
   }

   //유저아이디로 소켓유저정보 가져오기
   public getSocketUserInfoByUserId = async (userId: string): Promise<SocketUserInfo> => {
      return JSON.parse(await this.redisClient.get(this.SOCKET_ID_PREFIX + userId))
   }

   // addRoomRequestJoinWaiting에 포함 되어있는 socketId들의 유저정보 전부다 가져오기
   public getJoinWaitingMembers = async (roomCode: string): Promise<UserInfo[]> => {
      const roomKey = this.SOCKET_ROOM_REQUEST_JOIN_WAITING + roomCode
      const userIds = await this.redisClient.lRange(roomKey, 0, -1)
      const userInfoList: UserInfo[] = []

      for (const userId of userIds) {
         const socketUserInfo = await this.getSocketUserInfoByUserId(userId)
         if (socketUserInfo) {
            const userInfo: UserInfo = {
               userId: socketUserInfo.userId,
               name: socketUserInfo.name,
               profileUrl: socketUserInfo.profileUrl,
            }
            userInfoList.push(userInfo)
         }
      }

      return userInfoList
   }

   //룸에서 첫번째 유저아이디(방장)만 가져오기
   public getRoomOwnerUserIdByRoomCode = async (roomCode: string): Promise<string | null> => {
      const roomKey = this.SOCKET_ROOM_MEMBER_PREFIX + roomCode
      return await this.redisClient.lIndex(roomKey, 0)
   }

   //socket_room_member에 포함 되어있는 userId들의 유저정보 전부다 가져오기
   public getRoomMembers = async (roomCode: string): Promise<RoomParticipant[]> => {
      const roomKey = this.SOCKET_ROOM_MEMBER_PREFIX + roomCode
      const userIds = await this.redisClient.lRange(roomKey, 0, -1)
      const userInfoList: RoomParticipant[] = []

      for (let i = 0; i < userIds.length; i++) {
         const userId = userIds[i]
         const socketUserInfo = await this.getSocketUserInfoByUserId(userId)

         if (!socketUserInfo) {
            continue
         }

         const participant: RoomParticipant = {
            userId: socketUserInfo.userId,
            name: socketUserInfo.name,
            profileUrl: socketUserInfo.profileUrl,
            isOwner: i === 0,
            socketId: socketUserInfo.socketId,
            isMicrophoneOn: socketUserInfo.isMicrophoneOn,
            isCameraOn: socketUserInfo.isCameraOn,
            isHandRaised: socketUserInfo.isHandRaised,
         }
         userInfoList.push(participant)
      }

      return userInfoList
   }

   //룸 입장대기 웨이팅 리스트에서 유저아이디 제거
   public deleteJoinRoomWaiting = async (roomCode: string, userId: string): Promise<number> => {
      const roomKey = this.SOCKET_ROOM_REQUEST_JOIN_WAITING + roomCode
      return await this.redisClient.lRem(roomKey, 1, userId)
   }

   //유저정보에서 watingRoomCode 제거
   public deleteWaitingRoomCodeToUserInfo = async (userId: string): Promise<void> => {
      const userInfo = await this.getSocketUserInfoByUserId(userId)
      userInfo.roomWaitingCode = undefined
      const userKey = this.SOCKET_ID_PREFIX + userInfo.userId
      await this.redisClient.multi().set(userKey, JSON.stringify(userInfo)).expire(userKey, this.SOCKET_EXPIRE_TIME).exec()
   }

   //socket_room_member에서 특정 유저아이디 제거 (방 나가기)
   public deleteRoomMember = async (roomCode: string, userId: string): Promise<number> => {
      const roomKey = this.SOCKET_ROOM_MEMBER_PREFIX + roomCode
      return await this.redisClient.lRem(roomKey, 1, userId)
   }

   // 유저정보에 roomCode 제거
   public deleteRoomCodeToUserInfo = async (roomCode: string, userId: string): Promise<void> => {
      const userInfo = await this.getSocketUserInfoByUserId(userId)
      userInfo.roomCode = undefined
      const userKey = this.SOCKET_ID_PREFIX + userInfo.userId
      await this.redisClient.multi().set(userKey, JSON.stringify(userInfo)).expire(userKey, this.SOCKET_EXPIRE_TIME).exec()
   }

   //소켓아이디로 유저정보 제거
   public deleteSocketUserInfo = async (socketId: string): Promise<void> => {
      const userId = await this.getUserIdBySocketId(socketId)
      await this.redisClient.del(this.SOCKET_ID_PREFIX + userId)
      await this.redisClient.del(this.SOCKET_ID_PREFIX + socketId)
   }

   // isMicrophoneOn 상태 변경
   public updateMicrophoneState = async (userId: string, isMicrophoneOn: boolean): Promise<void> => {
      const userInfo = await this.getSocketUserInfoByUserId(userId)
      userInfo.isMicrophoneOn = isMicrophoneOn
      const userKey = this.SOCKET_ID_PREFIX + userInfo.userId
      await this.redisClient.multi().set(userKey, JSON.stringify(userInfo)).expire(userKey, this.SOCKET_EXPIRE_TIME).exec()
   }

   // isCameraOn 상태 변경
   public updateCameraState = async (userId: string, isCameraOn: boolean): Promise<void> => {
      const userInfo = await this.getSocketUserInfoByUserId(userId)
      userInfo.isCameraOn = isCameraOn
      const userKey = this.SOCKET_ID_PREFIX + userInfo.userId
      await this.redisClient.multi().set(userKey, JSON.stringify(userInfo)).expire(userKey, this.SOCKET_EXPIRE_TIME).exec()
   }

   // isHandRaised 상태 변경
   public updateHandRaisedState = async (userId: string, isHandRaised: boolean): Promise<void> => {
      const userInfo = await this.getSocketUserInfoByUserId(userId)
      userInfo.isHandRaised = isHandRaised
      const userKey = this.SOCKET_ID_PREFIX + userInfo.userId
      await this.redisClient.multi().set(userKey, JSON.stringify(userInfo)).expire(userKey, this.SOCKET_EXPIRE_TIME).exec()
   }
}
