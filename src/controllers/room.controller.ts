import { Request, Response, NextFunction } from "express"
import { successResponse, handleError } from "@utils/response.util"
import { ResError, ResCode, ResCookieOptions } from "@type/response.types"
import SocketRoomService from "@services/socket.room.service"

export default class RoomController {
   constructor(private readonly roomService: SocketRoomService) {}

   public getRoomCode = async (req: Request, res: Response): Promise<void> => {
      try {
         const roomCode = await this.roomService.createRoomCode()
         successResponse(res, ResCode.SUCCESS.message, {
            roomCode: roomCode,
         })
      } catch (error: any) {
         handleError(res, error)
      }
   }
}
