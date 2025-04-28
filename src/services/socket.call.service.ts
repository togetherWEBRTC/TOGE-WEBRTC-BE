import { UserInfo, SocketUserInfo, RoomParticipant } from "@type/user.info.type"
import { Service } from "typedi"
import { ISocketRepository } from "@repositorys/socket.i.repository"

export default class SocketCallService {
   constructor(private readonly socketRepository: ISocketRepository) {}

   //마이크 ON/OFF 상태 변경
   public changeMicState = async (userId: string, isMicOn: boolean): Promise<SocketUserInfo> => {
      await this.socketRepository.updateMicrophoneState(userId, isMicOn)
      return await this.socketRepository.getSocketUserInfoByUserId(userId)
   }

   //카메라 ON/OFF 상태 변경
   public changeCameraState = async (userId: string, isCameraOn: boolean): Promise<SocketUserInfo> => {
      await this.socketRepository.updateCameraState(userId, isCameraOn)
      return await this.socketRepository.getSocketUserInfoByUserId(userId)
   }

   //손들기 ON/OFF 상태 변경
   public changeHandRaisedState = async (userId: string, isHandRaised: boolean): Promise<SocketUserInfo> => {
      await this.socketRepository.updateHandRaisedState(userId, isHandRaised)
      return await this.socketRepository.getSocketUserInfoByUserId(userId)
   }

   //손든 유저만 리스트로 가져오기
   public getHandRaisedUserList = async (roomCode: string): Promise<SocketUserInfo[]> => {
      const userList = await this.socketRepository.getRoomMembers(roomCode)
      return userList.filter((user) => user.isHandRaised)
   }
}
