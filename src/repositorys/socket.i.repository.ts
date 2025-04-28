import { UserInfo, SocketUserInfo, RoomParticipant } from "@type/user.info.type"

export interface ISocketRepository {
   setUserInfo(socketId: string, userInfo: SocketUserInfo): Promise<void>
   getSocketUserInfoBySocketId(socketId: string): Promise<SocketUserInfo>
   getUserIdBySocketId(socketId: string): Promise<string>
   getSocketUserInfoByUserId(userId: string): Promise<SocketUserInfo>
   deleteSocketUserInfo(socketId: string): Promise<void>

   addRoomMember(roomCode: string, userId: string): Promise<void>
   getRoomMembers(roomCode: string): Promise<RoomParticipant[]>
   getRoomOwnerUserIdByRoomCode(roomCode: string): Promise<string | null>
   deleteRoomMember(roomCode: string, userId: string): Promise<number>

   addRoomRequestJoinWaiting(roomCode: string, userId: string): Promise<void>
   getJoinWaitingMembers(roomCode: string): Promise<UserInfo[]>
   deleteJoinRoomWaiting(roomCode: string, userId: string): Promise<number>

   updateRoomCodeToUserInfo(userId: string, roomCode: string): Promise<void>
   updateWaitingRoomCodeToUserInfo(userId: string, waitingRoomCode: string): Promise<void>
   deleteWaitingRoomCodeToUserInfo(userId: string): Promise<void>
   deleteRoomCodeToUserInfo(roomCode: string, userId: string): Promise<void>

   updateMicrophoneState(userId: string, isMicrophoneOn: boolean): Promise<void>
   updateCameraState(userId: string, isCameraOn: boolean): Promise<void>
   updateHandRaisedState(userId: string, isHandRaised: boolean): Promise<void>
}
