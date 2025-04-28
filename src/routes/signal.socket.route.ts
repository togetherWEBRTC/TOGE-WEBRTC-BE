import { Server, Socket } from "socket.io"
import { WebSocketEvents } from "@type/response.types"
import { DependencyKeys } from "@di/typedi"
import { Container } from "typedi"
import SignalController from "@controllers/signal.controller"

export const signalRouter = (io: Server, socket: Socket) => {
   const signalController = Container.get<SignalController>(DependencyKeys.SignalController)

   socket.on(WebSocketEvents.SIGNAL_SEND_OFFER, async (data: any, callback) => {
      signalController.sendOffer(socket, data, callback)
   })

   socket.on(WebSocketEvents.SIGNAL_SEND_ANSWER, async (data: any, callback) => {
      signalController.sendAnswer(socket, data, callback)
   })

   socket.on(WebSocketEvents.SIGNAL_SEND_ICE, async (data: any, callback) => {
      signalController.sendIce(socket, data, callback)
   })

   socket.on(WebSocketEvents.RTC_READY, async (data: any, callback) => {
      signalController.rtcReady(io, socket, data, callback)
   })
}
