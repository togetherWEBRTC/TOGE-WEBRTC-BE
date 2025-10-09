import { Server } from "socket.io"
import { WebSocketEvents } from "@type/response.types"
import { roomRouter } from "@routes/room.socket.route"
import { JWTService } from "@services/token.service"
import { Container } from "typedi"
import { DependencyKeys } from "@di/typedi"
import { TokenType } from "@type/token.types"
import SocketConnectionController from "@controllers/socket.connection.controller"
import { signalRouter } from "@routes/signal.socket.route"
import { callRouter } from "@routes/call.socket.route"
import { socketGlobalEventRoute } from "@routes/socket.report.route"
import { handleSocketError } from "@utils/socket.response.util"
import type { Packet } from "engine.io-parser"

export const socketRouter = (io: Server) => {
   const tokenService = Container.get<JWTService>(DependencyKeys.JWTService)
   const connectionController = Container.get<SocketConnectionController>(DependencyKeys.SocketConnectionController)

   socketGlobalEventRoute(io)

   io.on(WebSocketEvents.CONNECT, async (socket) => {
      try {
         const token = socket.handshake.auth.accessToken
         const sessionId = socket.handshake.auth.sessionId || ""
         const tokenPayload = await tokenService.decodeToken(token, TokenType.ACCESS)
         if (sessionId == "") {
            //web 용
            connectionController.connectUser(socket, tokenPayload)
         } else {
            connectionController.checkConnectUser(io, socket, tokenPayload, sessionId)
         }
      } catch (error) {
         console.error("❌ Client connected error:", error)
         socket.emit(WebSocketEvents.AUTH_ERROR)
      }

      socket.on(WebSocketEvents.DUPLICATE_CONNECTION_CHOICE, async (data: any, callback: (response: any) => void) => {
         try {
            const { forceDisconnectExisting, accessToken, sessionId } = data
            const tokenPayload = await tokenService.decodeToken(accessToken, TokenType.ACCESS)
            connectionController.handleDuplicateConnectionChoice(io, socket, forceDisconnectExisting, tokenPayload, sessionId, callback)
         } catch (error) {
            callback(handleSocketError(error))
         }
      })

      /*
            server namespace disconnect  / socket.disconnect()로 서버에서 강제 연결 해제
            client namespace disconnect, io client disconnect  / 클라이언트에서 socket.disconnect() 호출
            server shutting down         / 서버가 종료되고 있음
            ping timeout                 / 클라이언트가 pingTimeout 시간 내에 응답하지 않음
            transport close              / 기본 트랜스포트가 닫힘 (예: WebSocket 연결 끊어짐)
            transport error              / 트랜스포트에서 에러 발생
            parse error                  / 수신된 패킷을 파싱할 수 없음
            forced close                 / 연결이 강제로 닫힘
            forced server close          / 서버에서 강제로 연결 종료
            connect timeout              / connectTimeout 옵션에 의해 연결이 타임아웃됨
      */
      socket.on("disconnect", async (reason: any) => {
         console.log("❌ 소켓 연결 종료 , 이유 :", reason)

         await connectionController.handleDisconnect(io, socket, reason)
      })

      socket.conn.on("packet", (packet: Packet) => {
         // packet.type: "open" | "close" | "ping" | "pong" | "message" | "upgrade" | "noop"
         // packet.data: any
         console.log("--------- ", socket.id, " --------")
         console.log("packet:", packet.type, packet.data)
         socket.lastSeen = Date.now()
      })

      roomRouter(io, socket)
      signalRouter(io, socket)
      callRouter(io, socket)
   })
}
