import { Router } from "express"
import { Container } from "typedi"
import { DependencyKeys } from "@di/typedi"
import UserReportController from "@controllers/user.report.controller"
import { validateBearerAuthorization, verifyAccessToken } from "@middlewares/header.auth.middleware"

const router = Router()

// POST /api/report/block (사용자 차단)
router.post("/block", validateBearerAuthorization, verifyAccessToken, async (req, res) => {
   const userReportController = Container.get<UserReportController>(DependencyKeys.UserReportController)
   return userReportController.blockUser(req, res)
})

// DELETE /api/report/block (사용자 차단 해제)
router.delete("/block", validateBearerAuthorization, verifyAccessToken, async (req, res) => {
   const userReportController = Container.get<UserReportController>(DependencyKeys.UserReportController)
   return userReportController.unblockUser(req, res)
})

// GET /api/report/blocks (차단 목록 조회)
router.get("/blocks", validateBearerAuthorization, verifyAccessToken, async (req, res) => {
   const userReportController = Container.get<UserReportController>(DependencyKeys.UserReportController)
   return userReportController.getBlockedUsers(req, res)
})

// POST /api/report/user (사용자 신고)
router.post("/user", validateBearerAuthorization, verifyAccessToken, async (req, res) => {
   const userReportController = Container.get<UserReportController>(DependencyKeys.UserReportController)
   return userReportController.reportUser(req, res)
})

// POST /api/report/inquiry (문의 생성)
router.post("/inquiry", async (req, res) => {
   const userReportController = Container.get<UserReportController>(DependencyKeys.UserReportController)
   return userReportController.createInquiry(req, res)
})

export default router
