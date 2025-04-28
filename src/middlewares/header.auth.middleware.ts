import { Request, Response, NextFunction } from "express"
import { ResCode, ResError } from "@type/response.types"
import { errorResponse, handleError } from "@utils/response.util"
import { Container } from "typedi"
import { JWTService } from "@services/token.service"
import { DependencyKeys } from "@di/typedi"
import { TokenType } from "@type/token.types"

/**
 * Bearer Authorization 체크
 * @returns
 */
export const validateBearerAuthorization = (req: Request, res: Response, next: NextFunction) => {
   try {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
         throw new ResError({ code: ResCode.INVAILD_ACCESS_TOKEN.code, message: ResCode.INVAILD_ACCESS_TOKEN.message })
      }

      next()
   } catch (error) {
      handleError(res, error)
   }
}

const verifyToken = (tokenType: TokenType) => async (req: Request, res: Response, next: NextFunction) => {
   try {
      const authHeader = req.headers.authorization as string
      const token = authHeader.split("Bearer ")[1]
      const tokenService = Container.get<JWTService>(DependencyKeys.JWTService)
      const tokenPayload = await tokenService.decodeToken(token, tokenType)
      req.tokenPayload = tokenPayload
      if (tokenType === TokenType.ACCESS) {
         req.accessToken = token
      }
      if (tokenType === TokenType.REFRESH) {
         req.refreshToken = token
      }

      next()
   } catch (error) {
      handleError(res, error)
   }
}

export const verifyAccessToken = verifyToken(TokenType.ACCESS)
export const verifyRefreshToken = verifyToken(TokenType.REFRESH)
