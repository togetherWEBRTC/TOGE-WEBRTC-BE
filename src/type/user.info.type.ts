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
   sessionId: string
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

// 소켓 연결 상태 enum
export enum SocketConnectionStatus {
   NEW_CONNECTION = "NEW_CONNECTION",           // 새 접속 완료
   RECONNECTION_SUCCESS = "RECONNECTION_SUCCESS",     // 재접속 완료
   DUPLICATE_CONNECTION = "DUPLICATE_CONNECTION"       // 중복 로그인 (사용자 선택 필요)
}

// 소켓 사용자 상태 enum
export enum SocketUserState {
   IDLE = "IDLE",                    // 아무 방에도 속하지 않음
   IN_ROOM = "IN_ROOM",                 // 방에 참여 중
   WAITING_FOR_ROOM = "WAITING_FOR_ROOM"        // 방 입장 대기 중
}
