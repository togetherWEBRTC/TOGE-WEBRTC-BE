import SocketConnectionService from "@services/socket.connection.service"
import { TokenPayload } from "@/type/token.types"
import { Server, Socket } from "socket.io"
import SocketRoomController from "./socket.room.controller"
import { handleSocketError, successSocketResponse } from "@utils/socket.response.util"
import { WebSocketEvents } from "@type/response.types"
import { SocketUserInfo, SocketConnectionStatus, SocketUserState } from "@type/user.info.type"

export default class SocketConnectionController {
   constructor(private readonly connectionService: SocketConnectionService, private readonly roomController: SocketRoomController) {}

   /**
    * 기존 웹용 연결 처리 (레거시)
    */
   public connectUser = async (socket: any, payload: TokenPayload) => {
      try {
         this.connectionService.connectUser(socket, {
            userId: payload.userId,
            name: payload.nickname,
            profileUrl: payload.profileUrl,
         })
      } catch (error: any) {
         console.error(error)
      }
   }

   /**
    * 사용자 연결 해제 처리 (레거시)
    */
   public disconnectUser = async (socketId: string) => {
      try {
         this.connectionService.deleteSocketUserInfo(socketId)
      } catch (error: any) {
         console.error(error)
      }
   }

   /**
    * 연결 가능여부 파악: 재연결여부, 중복연결, 새연결 파악용
    *
    * 상황별 CHECK_CONNECTION 이벤트 응답:
    * 1. 새 연결: NEW_CONNECTION + IDLE
    * 2. 재연결 - 방 참여중: RECONNECTION_SUCCESS + IN_ROOM
    * 3. 재연결 - 방 대기중: RECONNECTION_SUCCESS + WAITING_FOR_ROOM
    * 4. 재연결 - 일반상태: RECONNECTION_SUCCESS + IDLE
    * 5. 중복연결: DUPLICATE_CONNECTION
    */
   public checkConnectUser = async (io: Server, socket: Socket, payload: TokenPayload, sessionId: string) => {
      try {
         let existingUserInfo: any = null
         try {
            existingUserInfo = await this.connectionService.getSocketUserInfoByUserId(payload.userId)
         } catch (error) {
            // 기존 유저 정보 없음
         }

         // 새 유저 처리
         if (!existingUserInfo || (!existingUserInfo.roomCode && !existingUserInfo.roomWaitingCode)) {
            await this.connectionService.setConnectUser(socket, {
               userId: payload.userId,
               name: payload.nickname,
               profileUrl: payload.profileUrl,
               sessionId: sessionId,
            })

            this.emitNewConnection(socket)
            return
         }

         // 재연결 처리 (같은 세션ID)
         if (existingUserInfo.sessionId === sessionId) {
            await this.handleReconnection(socket, existingUserInfo, sessionId)
            return
         }

         // 재연결 처리 (같은 소켓ID)
         if (existingUserInfo.socketId === socket.id) {
            await this.handleReconnection(socket, existingUserInfo, sessionId)
            return
         }

         // 중복연결 처리
         this.emitDuplicateConnection(socket, existingUserInfo)
         return
      } catch (error: any) {
         console.error(`❌ checkConnectUser 에러:`, error)
      }
   }

   /**
    * 중복 연결 선택 처리
    * @param forceDisconnectExisting true면 기존 연결 해제, false면 현재 연결 해제
    */
   public handleDuplicateConnectionChoice = async (io: Server, socket: Socket, forceDisconnectExisting: boolean, tokenPayload: TokenPayload, sessionId: string, callback: Function) => {
      try {
         const existingUserInfo = await this.connectionService.getSocketUserInfoByUserId(tokenPayload.userId)

         if (!existingUserInfo) {
            await this.handleNoExistingUser(socket, tokenPayload, sessionId, callback)
         } else if (forceDisconnectExisting) {
            await this.handleForceDisconnectExisting(io, socket, existingUserInfo, tokenPayload, sessionId, callback)
         } else {
            this.handleKeepExistingConnection(socket, callback)
         }
      } catch (error: any) {
         callback(handleSocketError(error))
      }
   }

   /**
    * 소켓 연결 해제 이벤트 처리
    * transport 관련은 재연결 대기, 그 외는 즉시 정리
    */
   public handleDisconnect = async (io: Server, socket: Socket, reason: string) => {
      try {
         const isTransportRelated = reason.includes("transport")

         if (!isTransportRelated) {
            await this.processImmediateDisconnect(io, socket)
         } else {
            await this.processTransportDisconnect(io, socket)
         }
      } catch (error: any) {
         console.error("handleDisconnect error:", error)
         await this.processImmediateDisconnect(io, socket)
      }
   }

   /**
    * Redis 키 만료로 인한 연결 해제 처리
    */
   public processExpiredDisconnect = async (io: Server, userId: string) => {
      try {
         const socketUserInfo = await this.connectionService.getSocketUserInfoByUserId(userId)
         const actualSocket = io.sockets.sockets.get(socketUserInfo.socketId)

         if (actualSocket && actualSocket.connected) {
            return
         }

         const mockSocket = {
            id: socketUserInfo.socketId,
            rooms: new Set([socketUserInfo.socketId, socketUserInfo.roomCode].filter(Boolean)),
            connected: false,
            leave: (room: string): Promise<void> | void => {
               return Promise.resolve()
            },
            join: (rooms: string | string[]): Promise<void> | void => {
               return Promise.resolve()
            },
            emit: () => false,
            disconnect: () => {},
         } as unknown as Socket

         try {
            await this.roomController.cancelJoinRoom(io, mockSocket)
         } catch (error: any) {}

         try {
            await this.roomController.leaveRoom(io, mockSocket)
         } catch (error: any) {}

         await this.connectionService.deleteSocketUserInfo(socketUserInfo.socketId)
         await this.connectionService.removeWaitingDisconnectUser(userId)
      } catch (error: any) {
         console.error(`❌ processExpiredDisconnect error for ${userId}:`, error)
      }
   }

   // ===================================================================
   // PRIVATE METHODS - 이벤트 전송 관련
   // ===================================================================

   /**
    * 새 연결 성공 이벤트 전송
    */
   private emitNewConnection = (socket: Socket) => {
      socket.emit(WebSocketEvents.CHECK_CONNECTION, {
         name: WebSocketEvents.CHECK_CONNECTION,
         connectionStatus: SocketConnectionStatus.NEW_CONNECTION,
         userState: SocketUserState.IDLE,
         message: "New connection established successfully.",
      })
   }

   /**
    * 중복 연결 감지 이벤트 전송
    */
   private emitDuplicateConnection = (socket: Socket, existingUserInfo: SocketUserInfo) => {
      socket.emit(WebSocketEvents.CHECK_CONNECTION, {
         name: WebSocketEvents.CHECK_CONNECTION,
         connectionStatus: SocketConnectionStatus.DUPLICATE_CONNECTION,
         userState: this.getUserState(existingUserInfo),
         message: "Duplicate connection detected. Please choose which connection to maintain.",
         isDuplicateConnection: true,
         existingSocketId: existingUserInfo.socketId,
         currentSocketId: socket.id,
      })
   }

   // ===================================================================
   // PRIVATE METHODS - 유틸리티 함수
   // ===================================================================

   /**
    * 사용자 상태 판별 (룸 정보 기반)
    */
   private getUserState = (userInfo: SocketUserInfo): SocketUserState => {
      if (userInfo.roomCode) return SocketUserState.IN_ROOM
      if (userInfo.roomWaitingCode) return SocketUserState.WAITING_FOR_ROOM
      return SocketUserState.IDLE
   }

   // ===================================================================
   // PRIVATE METHODS - 재연결 처리
   // ===================================================================

   /**
    * 재연결 처리 (세션ID 또는 소켓ID 동일한 경우)
    */
   private handleReconnection = async (socket: Socket, existingUserInfo: SocketUserInfo, sessionId: string) => {
      // 대기 중인 연결 해제 취소
      const waitingDisconnectUser = await this.connectionService.getWaitingDisconnectUser(existingUserInfo.userId)
      if (waitingDisconnectUser) {
         await this.connectionService.removeWaitingDisconnectUser(existingUserInfo.userId)
      }

      // 소켓ID 업데이트
      await this.connectionService.updateSocketId(existingUserInfo.userId, socket.id, sessionId)

      // 상태별 재연결 처리
      if (existingUserInfo.roomCode) {
         socket.join(existingUserInfo.roomCode)

         socket.emit(WebSocketEvents.CHECK_CONNECTION, {
            name: WebSocketEvents.CHECK_CONNECTION,
            connectionStatus: SocketConnectionStatus.RECONNECTION_SUCCESS,
            userState: SocketUserState.IN_ROOM,
            message: "Reconnection completed successfully.",
         })
      } else if (existingUserInfo.roomWaitingCode) {
         socket.emit(WebSocketEvents.CHECK_CONNECTION, {
            name: WebSocketEvents.CHECK_CONNECTION,
            connectionStatus: SocketConnectionStatus.RECONNECTION_SUCCESS,
            userState: SocketUserState.WAITING_FOR_ROOM,
            message: "Reconnection completed successfully.",
         })
      } else {
         socket.emit(WebSocketEvents.CHECK_CONNECTION, {
            name: WebSocketEvents.CHECK_CONNECTION,
            connectionStatus: SocketConnectionStatus.RECONNECTION_SUCCESS,
            userState: SocketUserState.IDLE,
            message: "재연결이 완료되었습니다.",
         })
      }
   }

   // ===================================================================
   // PRIVATE METHODS - 중복 연결 처리
   // ===================================================================

   /**
    * 기존 연결이 없는 경우 처리
    */
   private async handleNoExistingUser(socket: Socket, tokenPayload: TokenPayload, sessionId: string, callback: Function) {
      await this.connectionService.setConnectUser(socket, {
         userId: tokenPayload.userId,
         name: tokenPayload.nickname,
         profileUrl: tokenPayload.profileUrl,
         sessionId: sessionId,
      })
      callback(successSocketResponse({ connectionAllowed: true }))
   }

   /**
    * 기존 연결 강제 해제 처리
    */
   private async handleForceDisconnectExisting(io: Server, socket: Socket, existingUserInfo: SocketUserInfo, tokenPayload: TokenPayload, sessionId: string, callback: Function) {
      // 기존 소켓이 실제로 연결되어 있는지 확인
      const existingSocket = io.sockets.sockets.get(existingUserInfo.socketId)

      // userId 기반으로 통합 정리
      await this.cleanupUserByUserId(io, tokenPayload.userId, existingSocket || undefined)

      // 새로운 사용자 연결 등록
      await this.registerNewUser(socket, tokenPayload, sessionId)
      // 클라이언트에게 연결 허용 응답 전송
      callback(successSocketResponse({ connectionAllowed: true }))
   }

   /**
    * 기존 연결 유지 선택 처리
    */
   private handleKeepExistingConnection(socket: Socket, callback: Function) {
      callback(successSocketResponse({ connectionAllowed: false }))

      setTimeout(() => {
         socket.disconnect(true)
      }, 1000)
   }

   /**
    * 중복 연결로 인한 강제 로그아웃 알림 전송
    */
   private emitForceLogoutNotification(socket: Socket) {
      socket.emit(WebSocketEvents.FORCE_LOGOUT_BY_DUPLICATE_CONNECTION, {
         code: 0,
         message: "다른 기기에서 연결하여 현재 연결이 종료됩니다.",
      })
   }

   /**
    * userId 기반 사용자 완전 정리 (룸 나가기 + 대기 취소 + 소켓 정보 삭제)
    */
   private async cleanupUserByUserId(io: Server, userId: string, existingSocket?: Socket) {
      try {
         const userInfo = await this.connectionService.getSocketUserInfoByUserId(userId)

         // 활성 소켓이 있으면 강제 로그아웃 알림 전송
         if (existingSocket) {
            this.emitForceLogoutNotification(existingSocket)
         }

         // 룸 대기 중인 경우 취소
         if (userInfo.roomWaitingCode) {
            if (existingSocket) {
               await this.roomController.cancelJoinRoom(io, existingSocket)
            } else {
               await this.roomController.cancelJoinRoomByUserId(io, userId, userInfo.name, userInfo.profileUrl)
            }
         }

         // 룸 참여 중인 경우 나가기
         if (userInfo.roomCode) {
            if (existingSocket) {
               await this.roomController.leaveRoom(io, existingSocket)
            } else {
               await this.roomController.leaveRoomByUserId(io, userId, userInfo.name, userInfo.profileUrl)
            }
         }

         // 소켓 정보 삭제
         await this.connectionService.deleteSocketUserInfo(userInfo.socketId)

         // 소켓 연결 해제 (지연 처리)
         if (existingSocket) {
            setTimeout(() => {
               existingSocket.disconnect(true)
            }, 3000)
         }
      } catch (error: any) {
         console.error(`cleanupUserByUserId error for ${userId}:`, error)
      }
   }

   /**
    * 새 사용자 등록
    */
   private async registerNewUser(socket: Socket, tokenPayload: TokenPayload, sessionId: string) {
      await this.connectionService.setConnectUser(socket, {
         userId: tokenPayload.userId,
         name: tokenPayload.nickname,
         profileUrl: tokenPayload.profileUrl,
         sessionId: sessionId,
      })
   }

   // ===================================================================
   // PRIVATE METHODS - 연결 해제 처리
   // ===================================================================

   /**
    * 즉시 연결 해제 처리 (non-transport 종료)
    */
   private processImmediateDisconnect = async (io: Server, socket: Socket) => {
      try {
         await this.roomController.cancelJoinRoom(io, socket)
         await this.roomController.leaveRoom(io, socket)
         await this.connectionService.deleteSocketUserInfo(socket.id)
      } catch (error: any) {
         console.error("processImmediateDisconnect error:", error)
      }
   }

   /**
    * Transport 관련 연결 해제 처리 (재연결 대기)
    */
   private processTransportDisconnect = async (io: Server, socket: Socket) => {
      try {
         const socketUserInfo = await this.connectionService.getSocketUserInfoBySocketId(socket.id)

         // sessionId가 없으면 재접속 처리 불필요 (레거시용)
         if (!socketUserInfo.sessionId || socketUserInfo.sessionId === "") {
            await this.connectionService.deleteSocketUserInfo(socket.id)
            return
         }

         if (socketUserInfo.socketId === socket.id) {
            // 45초 대기 등록
            await this.connectionService.addWaitingDisconnectUser(socketUserInfo.userId, socketUserInfo)
         } else {
            // 이미 다른 소켓으로 재접속한 경우
            await this.connectionService.deleteSocketUserInfo(socket.id)
         }
      } catch (error: any) {
         console.error("processTransportDisconnect error:", error)
      }
   }
}
