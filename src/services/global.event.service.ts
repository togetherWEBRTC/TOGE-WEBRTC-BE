import { EventEmitter } from "events"

export default class GlobalEventService extends EventEmitter {
   constructor() {
      super()
   }

   triggerSocketEvent(eventName: string, data: any): void {
      this.emit("socket_event", {
         eventName,
         data,
      })
   }
}
