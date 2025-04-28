import { Router } from "express"
import { Container } from "typedi"
import { DependencyKeys } from "@di/typedi"
import AuthController from "@controllers/auth.controller"
import { validateBearerAuthorization, verifyAccessToken, verifyRefreshToken } from "@middlewares/header.auth.middleware"

const router = Router()

router.post("/signup", async (req, res) => {
   const authController = Container.get<AuthController>(DependencyKeys.AuthController)
   return authController.signup(req, res)
})

router.post("/login", async (req, res) => {
   const authController = Container.get<AuthController>(DependencyKeys.AuthController)
   return authController.login(req, res)
})

router.post("/logout", async (req, res) => {
   const authController = Container.get<AuthController>(DependencyKeys.AuthController)
   return authController.logout(req, res)
})

router.get("/usable-id/:userId", async (req, res) => {
   const authController = Container.get<AuthController>(DependencyKeys.AuthController)
   return authController.isDuplicatedUserId(req, res, req.params.userId)
})

router.post("/refresh/token", validateBearerAuthorization, verifyRefreshToken, async (req, res) => {
   const authController = Container.get<AuthController>(DependencyKeys.AuthController)
   return authController.refreshAccessToken(req, res)
})

router.get("/user-info", validateBearerAuthorization, verifyAccessToken, async (req, res) => {
   const authController = Container.get<AuthController>(DependencyKeys.AuthController)
   return authController.getUserInfo(req, res)
})

router.post("/modify/profile-image", validateBearerAuthorization, verifyAccessToken, async (req, res) => {
   const authController = Container.get<AuthController>(DependencyKeys.AuthController)
   return authController.modifyProfileImage(req, res)
})

export default router
