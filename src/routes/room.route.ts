import { Router } from "express"
import { Container } from "typedi"
import { DependencyKeys } from "@di/typedi"
import { validateBearerAuthorization, verifyAccessToken, verifyRefreshToken } from "@middlewares/header.auth.middleware"
import RoomController from "@controllers/room.controller"

const router = Router()

router.get("/code", validateBearerAuthorization, verifyAccessToken, async (req, res) => {
   const roomController = Container.get<RoomController>(DependencyKeys.RoomController)
   return roomController.getRoomCode(req, res)
})

export default router
