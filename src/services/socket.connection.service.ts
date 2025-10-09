import { UserInfo, SocketUserInfo } from "@type/user.info.type"
import { ISocketRepository } from "@repositorys/socket.i.repository"

export default class SocketConnectionService {
   constructor(private readonly socketRepository: ISocketRepository) {}

   public connectUser = async (socket: any, userInfo: UserInfo) => {
      const socketUserInfo: SocketUserInfo = {
         socketId: socket.id,
         userId: userInfo.userId,
         name: userInfo.name,
         sessionId: "",
         profileUrl: userInfo.profileUrl,
         isMicrophoneOn: true,
         isCameraOn: true,
         isHandRaised: false,
      }
      await this.setUserInfo(socket.id, socketUserInfo)
   }

   public setConnectUser = async (socket: any, userInfo: UserInfo & { sessionId: string }) => {
      const socketUserInfo: SocketUserInfo = {
         socketId: socket.id,
         userId: userInfo.userId,
         name: userInfo.name,
         profileUrl: userInfo.profileUrl,
         sessionId: userInfo.sessionId,
         isMicrophoneOn: true,
         isCameraOn: true,
         isHandRaised: false,
      }
      await this.setUserInfo(socket.id, socketUserInfo)
   }

   public setUserInfo = async (socketId: string, userInfo: SocketUserInfo) => {
      try {
         await this.socketRepository.setUserInfo(socketId, userInfo)
      } catch (error: any) {
         console.error(error)
      }
   }

   public getSocketUserInfoBySocketId = async (socketId: string): Promise<SocketUserInfo> => {
      try {
         return await this.socketRepository.getSocketUserInfoBySocketId(socketId)
      } catch (error: any) {
         console.error(error)
         throw new Error(`SocketUserInfo with socketId ${socketId} not found`)
      }
   }

   public getSocketUserInfoByUserId = async (userId: string): Promise<SocketUserInfo> => {
      try {
         return await this.socketRepository.getSocketUserInfoByUserId(userId)
      } catch (error: any) {
         console.error(error)
         throw new Error(`SocketUserInfo with userId ${userId} not found`)
      }
   }

   public deleteSocketUserInfo = async (socketId: string) => {
      try {
         await this.socketRepository.deleteSocketUserInfo(socketId)
      } catch (error: any) {
         console.error(error)
      }
   }

   public updateSocketId = async (userId: string, newSocketId: string, sessionId: string) => {
      try {
         const userInfo = await this.socketRepository.getSocketUserInfoByUserId(userId)
         const oldSocketId = userInfo.socketId
         console.log("----updateSocketId oldSocketId : ", oldSocketId, " newSocketId : ", newSocketId)
         // 기존 소켓id 삭제
         await this.socketRepository.deleteSocketUserInfo(oldSocketId)

         // 새 소켓 정보로 재생성
         const updatedUserInfo = {
            ...userInfo,
            socketId: newSocketId,
            sessionId: sessionId,
         }
         await this.socketRepository.setUserInfo(newSocketId, updatedUserInfo)
      } catch (error: any) {
         console.error(error)
      }
   }

   // 대기 연결 해제 관련 메서드들
   public addWaitingDisconnectUser = async (userId: string, socketUserInfo: any) => {
      try {
         const waitingData = {
            socketId: socketUserInfo.socketId,
            roomCode: socketUserInfo.roomCode,
            userId: userId,
            disconnectTime: new Date().toISOString(),
         }
         await this.socketRepository.setWaitingDisconnectUser(userId, waitingData, 30)
      } catch (error: any) {
         console.error(error)
      }
   }

   public getWaitingDisconnectUser = async (userId: string) => {
      try {
         return await this.socketRepository.getWaitingDisconnectUser(userId)
      } catch (error: any) {
         console.error(error)
         return null
      }
   }

   public removeWaitingDisconnectUser = async (userId: string) => {
      try {
         await this.socketRepository.deleteWaitingDisconnectUser(userId)
      } catch (error: any) {
         console.error(error)
      }
   }
}
