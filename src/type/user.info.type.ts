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

export type SocialUserInfo = {
   subId: string
   email: string
   type: string
}

export enum SocialType {
   GOOGLE,
}

export type UserInteraction = {
   targetUserId: string
   /** 차단 상태
    * - 'none': 차단 관계 없음
    * - 'blocked_by_me': 내가 상대방을 차단한 상태
    * - 'blocking_me': 상대방이 나를 차단한 상태
    * - 'mutual': 서로 차단한 상태
    */
   blockStatus: "none" | "blocked_by_me" | "blocking_me" | "mutual"
}

export type RoomUserInteraction = {
   targetUserId: string
   /** 콘텐츠가 차단되었는지 (상대방을 차단했거나 상대방이 나를 차단한 경우) */
   isContentBlocked: boolean
   /** 차단 인디케이터를 보여줄지 (내가 상대방을 차단한 경우에만) */
   isShowBlockIndicator: boolean
}
