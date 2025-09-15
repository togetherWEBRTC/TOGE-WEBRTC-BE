import { Router } from "express"
import { Container } from "typedi"
import { DependencyKeys } from "@di/typedi"
import LogController from "@controllers/log.controller"
import { validateBearerAuthorization, verifyAccessToken } from "@middlewares/header.auth.middleware"

const router = Router()

router.post("/call-entry-exit", validateBearerAuthorization, verifyAccessToken, async (req, res) => {
   const logController = Container.get<LogController>(DependencyKeys.LogController)
   return logController.writeCallEntryExitLog(req, res)
})

export default router
