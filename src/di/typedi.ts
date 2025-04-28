import SocketConnectionService from "@services/socket.connection.service"
import { Container } from "typedi"
import { AccountRepository } from "@repositorys/account.repository"
import { AuthService } from "@services/auth.service"
import AuthController from "@controllers/auth.controller"
import { JWTService } from "@services/token.service"
import SocketRepository from "@repositorys/socket.repository"
import SocketConnectionController from "@controllers/socket.connection.controller"
import SocketRoomService from "@services/socket.room.service"
import SocketRoomController from "@controllers/socket.room.controller"
import SignalController from "@controllers/signal.controller"
import SocketCallController from "@controllers/call.controller"
import SocketCallService from "@/services/socket.call.service"
import RoomController from "@controllers/room.controller"

export const DependencyKeys = {
   AccountRepository: "AccountRepository",
   AuthService: "AuthService",
   JWTService: "JWTService",
   AuthController: "AuthController",
   RoomController: "RoomController",
   SocketRepository: "SocketRepository",
   SocketConnectionService: "SocketConnectionService",
   SocketConnectionController: "SocketConnectionController",
   SocketRoomService: "SocketRoomService",
   SocketRoomController: "SocketRoomController",
   WebRTCManager: "WebRTCManager",
   SignalController: "SignalController",
   SocketCallController: "SocketCallController",
   SocketCallService: "SocketCallService",
}

export default () => {
   try {
      // repository
      const accountRepository = new AccountRepository()
      Container.set(DependencyKeys.AccountRepository, accountRepository)

      const socketRepository = new SocketRepository()
      Container.set(DependencyKeys.SocketRepository, socketRepository)

      // service
      const jwtTokenService = new JWTService()
      Container.set(DependencyKeys.JWTService, jwtTokenService)

      const socketConnectionService = new SocketConnectionService(socketRepository)
      Container.set(DependencyKeys.SocketConnectionService, socketConnectionService)

      const socketRoomService = new SocketRoomService(socketRepository)
      Container.set(DependencyKeys.SocketRoomService, socketRoomService)

      const authService = new AuthService(accountRepository, jwtTokenService)
      Container.set(DependencyKeys.AuthService, authService)

      const socketCallService = new SocketCallService(socketRepository)
      Container.set(DependencyKeys.SocketCallService, socketCallService)

      // controller
      const authController = new AuthController(authService, jwtTokenService)
      Container.set(DependencyKeys.AuthController, authController)

      const roomController = new RoomController(socketRoomService)
      Container.set(DependencyKeys.RoomController, roomController)

      const socketConnectionController = new SocketConnectionController(socketConnectionService)
      Container.set(DependencyKeys.SocketConnectionController, socketConnectionController)

      const socketRoomController = new SocketRoomController(socketRoomService, socketConnectionService)
      Container.set(DependencyKeys.SocketRoomController, socketRoomController)

      const signalController = new SignalController(socketConnectionService, socketRoomService)
      Container.set(DependencyKeys.SignalController, signalController)

      const socketCallController = new SocketCallController(socketConnectionService, socketRoomService, socketCallService)
      Container.set(DependencyKeys.SocketCallController, socketCallController)
   } catch (err) {
      console.error("⭐️ Error during dependency injection:", err)
   }
}
