import { getRedisSubscriberClient } from "@config/redis"
import { Container } from "typedi"
import { DependencyKeys } from "@di/typedi"
import GlobalEventService from "@services/global.event.service"
import { WebSocketEvents } from "@type/response.types"

export const initRedisKeyspaceSubscriber = async () => {
   try {
      const subscriberClient = getRedisSubscriberClient()
      const globalEventService = Container.get<GlobalEventService>(DependencyKeys.GlobalEventService)

      await subscriberClient.pSubscribe("__keyevent@0__:expired", (message, pattern) => {
         console.log(`Redis key expired: ${message}`)
         globalEventService.emit("socket_event", {
            eventName: WebSocketEvents.KEY_EXPIRED,
            data: { expiredKey: message },
         })
      })

      console.log("Subscribed to Redis keyspace expired events")
   } catch (error) {
      console.error("Failed to initialize Redis Keyspace Subscriber:", error)
   }
}
