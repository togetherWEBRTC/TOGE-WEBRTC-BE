export type UserInfo = {
   userId: string
   name: string
   profileUrl: string
}

export type SocketUserInfo = {
   userId: string
   name: string
   profileUrl: string
   socketId: string
   roomCode?: string
   roomWaitingCode?: string
   isMicrophoneOn: boolean
   isCameraOn: boolean
   isHandRaised: boolean
}

export type RoomParticipant = {
   userId: string
   name: string
   profileUrl: string
   isOwner: boolean
   socketId: string
   isMicrophoneOn: boolean
   isCameraOn: boolean
   isHandRaised: boolean
}
