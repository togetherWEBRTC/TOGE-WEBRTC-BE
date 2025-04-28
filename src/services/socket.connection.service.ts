import { UserInfo, SocketUserInfo } from "@type/user.info.type"
import { ISocketRepository } from "@repositorys/socket.i.repository"

export default class SocketConnectionService {
   constructor(private readonly socketRepository: ISocketRepository) {}

   public connectUser = async (socket: any, userInfo: UserInfo) => {
      const socketUserInfo: SocketUserInfo = {
         socketId: socket.id,
         userId: userInfo.userId,
         name: userInfo.name,
         profileUrl: userInfo.profileUrl,
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
}
