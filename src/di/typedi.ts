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
import SocialGoogleDatasource from "@/network/social.google.datasource"
import UserReportRepository from "@repositorys/user.report.repository"
import UserReportService from "@services/user.report.service"
import UserReportController from "@controllers/user.report.controller"
import LogRepository from "@repositorys/log.repository"
import LogService from "@services/log.service"
import LogController from "@controllers/log.controller"
import GlobalEventService from "@services/global.event.service"
import SocketBlockController from "@controllers/socket.block.controller"

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
   SocialGoogleDatasource: "SocialGoogleDatasource",
   UserReportRepository: "UserReportRepository",
   UserReportService: "UserReportService",
   UserReportController: "UserReportController",
   LogRepository: "LogRepository",
   LogService: "LogService",
   LogController: "LogController",
   GlobalEventService: "GlobalEventService",
   SocketBlockController: "SocketBlockController",
}

export default () => {
   try {
      const socialGoogleDatasource = new SocialGoogleDatasource()
      Container.set(DependencyKeys.SocialGoogleDatasource, socialGoogleDatasource)

      // repository
      const accountRepository = new AccountRepository(socialGoogleDatasource)
      Container.set(DependencyKeys.AccountRepository, accountRepository)

      const socketRepository = new SocketRepository()
      Container.set(DependencyKeys.SocketRepository, socketRepository)

      const userReportRepository = new UserReportRepository()
      Container.set(DependencyKeys.UserReportRepository, userReportRepository)

      const logRepository = new LogRepository()
      Container.set(DependencyKeys.LogRepository, logRepository)

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

      const userReportService = new UserReportService(userReportRepository)
      Container.set(DependencyKeys.UserReportService, userReportService)

      const logService = new LogService(logRepository)
      Container.set(DependencyKeys.LogService, logService)

      const globalEventService = new GlobalEventService()
      Container.set(DependencyKeys.GlobalEventService, globalEventService)

      // controller
      const authController = new AuthController(authService, jwtTokenService)
      Container.set(DependencyKeys.AuthController, authController)

      const roomController = new RoomController(socketRoomService)
      Container.set(DependencyKeys.RoomController, roomController)

      const socketRoomController = new SocketRoomController(socketRoomService, socketConnectionService, logService, userReportService)
      Container.set(DependencyKeys.SocketRoomController, socketRoomController)

      const socketConnectionController = new SocketConnectionController(socketConnectionService, socketRoomController)
      Container.set(DependencyKeys.SocketConnectionController, socketConnectionController)

      const signalController = new SignalController(socketConnectionService, socketRoomService)
      Container.set(DependencyKeys.SignalController, signalController)

      const socketCallController = new SocketCallController(socketConnectionService, socketRoomService, socketCallService)
      Container.set(DependencyKeys.SocketCallController, socketCallController)

      const userReportController = new UserReportController(userReportService, globalEventService)
      Container.set(DependencyKeys.UserReportController, userReportController)

      const logController = new LogController(logService)
      Container.set(DependencyKeys.LogController, logController)

      const socketBlockController = new SocketBlockController(socketConnectionService)
      Container.set(DependencyKeys.SocketBlockController, socketBlockController)
   } catch (err) {
      console.error("⭐️ Error during dependency injection:", err)
   }
}
// test
