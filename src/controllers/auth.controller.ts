import { Request, Response, NextFunction } from "express"
import { AuthService } from "@services/auth.service"
import { successResponse, handleError } from "@utils/response.util"
import { ResError, ResCode, ResCookieOptions } from "@/type/response.types"
import { z } from "zod"
import { validateQuery } from "@utils/request.validation.util"
import { isStringEmpty } from "@utils/string.util"
import { getRefreshTokenCookie } from "@utils/cookies.util"
import { JWTService } from "@services/token.service"
import * as TokenTypes from "@type/token.types"
import { SocialType } from "@/type/user.info.type"

export default class AuthController {
   constructor(private readonly authService: AuthService, private readonly tokenService: JWTService) {}

   public signup = async (req: Request, res: Response): Promise<void> => {
      try {
         const query = z.object({
            userId: z.string({ message: "userId is required" }),
            nickname: z.string({ message: "nickname is required" }),
            password: z.string({ message: "password is required" }),
            passwordConfirm: z.string({ message: "password confirm is required" }),
         })
         const data = validateQuery(query, req, res)
         await this.authService.signup(data.userId, data.nickname, data.password, data.passwordConfirm)
         successResponse(res, ResCode.SUCCESS.message)
      } catch (error: any) {
         handleError(res, error)
      }
   }

   public socialSignUp = async (req: Request, res: Response): Promise<void> => {
      try {
         const query = z.object({
            token: z.string({ message: "token is required" }),
            nickname: z.string({ message: "nickname is required" }),
            isAgreedTerms: z.boolean({ message: "isAgreedTerms is required" }),
            isAgreedPrivacy: z.boolean({ message: "isAgreedPrivacy is required" }),
         })
         const data = validateQuery(query, req, res)

         if (data.isAgreedTerms == false || data.isAgreedPrivacy == false) {
            throw new ResError({ code: ResCode.NEED_TO_AGREED_TERMS.code, message: ResCode.NEED_TO_AGREED_TERMS.message })
         }

         const [userInfo, tokenPair] = await this.authService.socialSignUp(data.token, data.nickname, data.isAgreedTerms, data.isAgreedPrivacy)
         const responseData = {
            userInfo: userInfo,
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
         }
         const resRefreshTokenCookie = await getRefreshTokenCookie(req, tokenPair.refreshToken)

         successResponse(res, ResCode.SUCCESS.message, responseData, [resRefreshTokenCookie])
      } catch (error: any) {
         handleError(res, error)
      }
   }

   public login = async (req: Request, res: Response): Promise<void> => {
      try {
         const query = z.object({
            id: z.string({ message: "id is required" }),
            password: z.string({ message: "password is required" }),
         })
         const data = validateQuery(query, req, res)
         const [userInfo, tokenPair] = await this.authService.login(data.id, data.password)
         const responseData = {
            userInfo: userInfo,
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
         }
         const resRefreshTokenCookie = await getRefreshTokenCookie(req, tokenPair.refreshToken)

         successResponse(res, ResCode.SUCCESS.message, responseData, [resRefreshTokenCookie])
      } catch (error: any) {
         handleError(res, error)
      }
   }

   public socialLogin = async (req: Request, res: Response): Promise<void> => {
      let data: { token: string; type: string }
      try {
         const query = z.object({
            token: z.string({ message: "token is required" }),
            type: z.string({ message: "type is required" }),
         })
         data = validateQuery(query, req, res)

         const socialType = this.returnSocialType(data.type)

         if (socialType == null) {
            throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: "social type data is invailed, need to only uppercase" + data.type })
         }

         const [userInfo, tokenPair] = await this.authService.socialLogin(data.token, socialType)
         const responseData = {
            userInfo: userInfo,
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
         }
         const resRefreshTokenCookie = await getRefreshTokenCookie(req, tokenPair.refreshToken)

         successResponse(res, ResCode.SUCCESS.message, responseData, [resRefreshTokenCookie])
      } catch (error: any) {
         if (error instanceof ResError && error.code === ResCode.NEED_TO_ADDITIONAL_TERMS.code) {
            const responseData = {
               isNeedAdditionalInfo: true,
               socialToken: error.data /*social token */,
               socialType: data!.type,
            }
            successResponse(res, ResCode.SUCCESS.message, responseData)
            return
         }
         handleError(res, error)
      }
   }

   public modifyNickname = async (req: Request, res: Response): Promise<void> => {
      try {
         if (!req.tokenPayload) {
            throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: "token data is invalid" })
         }
         const userId = req.tokenPayload.userId

         const query = z.object({
            nickname: z.string({ message: "nickname is required" }),
         })
         const data = validateQuery(query, req, res)

         await this.authService.updateNickname(userId, data.nickname)

         const userInfo = await this.authService.getUserInfo(userId)

         const tokenPayload: TokenTypes.TokenPayload = {
            userId: userId,
            nickname: userInfo.name,
            profileUrl: userInfo.profileUrl,
         }
         const accessToken = await this.tokenService.getNewToken(tokenPayload, TokenTypes.TokenType.ACCESS)

         successResponse(res, ResCode.SUCCESS.message, { userInfo: userInfo, accessToken: accessToken })
      } catch (error: any) {
         handleError(res, error)
      }
   }

   public logout = async (req: Request, res: Response): Promise<void> => {
      try {
         res.clearCookie("refreshToken", {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
            path: "/",
            domain: process.env.FRONT_URL,
         })
            .status(200)
            .json({
               code: ResCode.SUCCESS.code,
               message: ResCode.SUCCESS.message,
            })
      } catch (error: any) {
         handleError(res, error)
      }
   }

   public refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
      try {
         const refreshToken = req.refreshToken as string
         const accessToken = await this.authService.getAccessToken(refreshToken)

         successResponse(res, ResCode.SUCCESS.message, { accessToken: accessToken })
      } catch (error: any) {
         handleError(res, error)
      }
   }

   public isDuplicatedUserId = async (req: Request, res: Response, userId: string): Promise<void> => {
      try {
         if (isStringEmpty(userId) == true) {
            throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: "userId is required" })
         }
         await this.authService.isAvailableUsingUserId(userId)
         successResponse(res, ResCode.SUCCESS.message)
      } catch (error: any) {
         handleError(res, error)
      }
   }

   public getUserInfo = async (req: Request, res: Response): Promise<void> => {
      try {
         if (!req.tokenPayload) {
            throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: "token data is invailed" })
         }
         const userId = req.tokenPayload.userId
         const userInfo = await this.authService.getUserInfo(userId)
         successResponse(res, ResCode.SUCCESS.message, {
            userInfo: userInfo,
         })
      } catch (error: any) {
         handleError(res, error)
      }
   }

   public modifyProfileImage = async (req: Request, res: Response): Promise<void> => {
      try {
         if (!req.tokenPayload) {
            throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: "token data is invailed" })
         }
         const userId = req.tokenPayload.userId
         await this.authService.modifyProfileImage(userId)
         const userInfo = await this.authService.getUserInfo(userId)

         const tokenPayload: TokenTypes.TokenPayload = {
            userId: userId,
            nickname: userInfo.name,
            profileUrl: userInfo.profileUrl,
         }
         const accessToken = await this.tokenService.getNewToken(tokenPayload, TokenTypes.TokenType.ACCESS)

         successResponse(res, ResCode.SUCCESS.message, { userInfo: userInfo, accessToken: accessToken })
      } catch (error: any) {
         handleError(res, error)
      }
   }

   public withdraw = async (req: Request, res: Response): Promise<void> => {
      try {
         if (!req.tokenPayload) {
            throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: "token data is invalid" })
         }
         const userId = req.tokenPayload.userId
         await this.authService.withdraw(userId)

         res.clearCookie("refreshToken", {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
            path: "/",
            domain: process.env.FRONT_URL,
         })

         successResponse(res, ResCode.SUCCESS.message)
      } catch (error: any) {
         handleError(res, error)
      }
   }

   public socialWithdraw = async (req: Request, res: Response): Promise<void> => {
      try {
         if (!req.tokenPayload) {
            throw new ResError({ code: ResCode.INVALID_PARAMS.code, message: "token data is invalid" })
         }
         const userId = req.tokenPayload.userId
         await this.authService.deleteSocialWithdraw(userId)

         res.clearCookie("refreshToken", {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
            path: "/",
            domain: process.env.FRONT_URL,
         })

         successResponse(res, ResCode.SUCCESS.message)
      } catch (error: any) {
         handleError(res, error)
      }
   }

   private returnSocialType(type: string): SocialType | null {
      if (type === "GOOGLE") {
         return SocialType.GOOGLE
      } else {
         console.error("social type is invalid : " + type)
         return null
      }
   }
}
