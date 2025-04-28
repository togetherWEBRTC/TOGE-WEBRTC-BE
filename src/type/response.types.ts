export interface ResCodeType {
   code: number
   message: string
}

export const ResCode = {
   SUCCESS: { code: 0, message: "Success" },
   SERVER_ERROR: { code: 1, message: "Server Error" },
   INVALID_PARAMS: { code: 2, message: "unknown invalid parameters" },
   DATA_ERROR: { code: 3, message: "Data Error" },

   // Auth
   INVAILD_ACCESS_TOKEN: { code: 1001, message: "invalid access token" },
   INVAILD_REFRESH_TOKEN: { code: 1002, message: "invalid refresh token" },
   FAILED_LOGIN: { code: 1003, message: "failed login" },
   DUPLICATED_ID: { code: 1004, message: "duplicated id" },
   PASSWORD_NOT_MATCH: { code: 1005, message: "password not match" },
   
   // SOCKET ROOM
   ALREADY_JOINED_ROOM: { code: 10001, message: "already joined room" },
   ROOM_NOT_FOUND: { code: 10002, message: "room not found" },
   NOT_ROOM_OWNER: { code: 10003, message: "not room owner" },
   NOT_ROOM_MEMBER: { code: 10004, message: "not room member" },
   ALREADY_EXISTED_ROOM: { code: 10006, message: "already existed room" },

   // SOCKET CALL
   REQUESTED_SAME_STATE: { code: 10005, message: "requested same state" },
}

export const WebSocketEvents = {
   CONNECT: "connection",
   DISCONNECT: "disconnect",

   AUTH_ERROR: "auth_error",

   ROOM_CREATE: "room_create",
   ROOM_LEAVE: "room_leave", // 룸 나가기
   ROOM_REQUEST_JOIN: "room_request_join", // 입장 희망
   ROOM_REQUEST_JOIN_CANCEL: "room_request_join_cancel", // 입장 희망 취소
   ROOM_NOTIFY_WAIT: "room_notify_wait", // 새로운 입장 대기자 알림(방장에게)

   ROOM_DECIDE_JOIN_FROM_HOST: "room_decide_join_from_host", // 방장으로 부터 입장 희망자 입장 허가/거절
   ROOM_NOTIFY_DECIDE_JOIN_FROM_HOST: "room_notify_decide_join_host", // 방장이 입장 승인 알림

   ROOM_NOTIFY_UPDATE_PARTICIPANT: "room_notify_update_participant", // 참여자 변경알림(입장,퇴장)
   ROOM_NOTIFY_UPDATE_OWNER: "room_notify_update_owner", // 방장 변경 알림(방장된사람에게만)
   ROOM_MEMBER_LIST: "room_member_list", // 방 참여자 리스트

   ROOM_MEMBER_EXPEL: "room_member_expel", // 방장이 참여자 추방
   ROOM_NOTIFY_EXPEL: "room_notify_expel", // 당사자에게 추방 알림

   SIGNAL_SEND_OFFER: "signal_send_offer", // offer 전송
   SIGNAL_NOTIFY_OFFER: "signal_notify_offer", // offer 전달되었다는 알림
   SIGNAL_SEND_ANSWER: "signal_send_answer", // answer 전송
   SIGNAL_NOTIFY_ANSWER: "signal_notify_answer", // answer 전달되었다는 알림
   SIGNAL_SEND_ICE: "signal_send_ice", // candidate 전송
   SIGNAL_NOTIFY_ICE: "signal_notify_ice", // candidate 전달되었다는 알림
   RTC_READY: "rtc_ready",

   CALL_CHANGE_MIC: "call_change_mic", // 마이크 on/off
   CALL_NOTIFY_CHANGE_MIC: "call_notify_change_mic", // 마이크 on/off 알림
   CALL_CHANGE_CAMERA: "call_change_camera", // 카메라 on/off
   CALL_NOTIFY_CHANGE_CAMERA: "call_notify_change_camera", // 카메라 on/off 알림

   CALL_CHANGE_HAND_RAISED: "call_change_hand_raised", // 손들기 on/off
   CALL_NOTIFY_CHANGE_HAND_RAISED: "call_notify_change_hand_raised", // 손들기 on/off 알림

   CHAT_SEND_CHAT_MESSAGE: "chat_send_message", // 채팅 메시지 전송
   CHAT_NOTIFY_CHAT_MESSAGE: "chat_notify_message", // 채팅 메시지 알림

   SOCKET_ERROR: "socket_error",
}

export class ResError extends Error {
   code: number
   message: string

   constructor(p: { code: number; message: string }) {
      super(p.message)
      this.code = p.code
      this.message = p.message
   }
}

export interface ResCookieOptions {
   maxAge?: number | undefined // 만료시간 밀리초
   signed?: boolean | undefined // 서명여부
   expires?: Date | undefined // 만료시간 Date 타입
   httpOnly?: boolean | undefined
   path?: string | undefined //경로
   domain?: string | undefined // 도메인
   secure?: boolean | undefined // https 만 가능
   sameSite?: boolean | "lax" | "strict" | "none" | undefined
   priority?: "low" | "medium" | "high"
   partitioned?: boolean | undefined
}

export interface ResCookie {
   name: string
   value: string
   options?: ResCookieOptions
}

export interface SocketResponse<T = any> {
   code: number
   message: string
   data?: T
}
