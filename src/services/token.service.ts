import * as TokenTypes from "@type/token.types"
import dotenv from "dotenv"
import { ResError, ResCode } from "@type/response.types"
import * as jose from "jose"

export class JWTService {
   private readonly encoder = new TextEncoder()
   private readonly accessTokenSecret!: string
   private readonly refreshTokenSecret!: string
   private readonly accessTokenExpiresIn!: string
   private readonly refreshTokenExpiresIn!: string

   constructor() {
      dotenv.config()
      this.accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET as string
      this.refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET as string
      this.accessTokenExpiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN as string
      this.refreshTokenExpiresIn = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN as string
   }

   public async getTokenPair(payload: TokenTypes.TokenPayload): Promise<TokenTypes.TokenPair> {
      return {
         accessToken: await this.getNewToken(payload, TokenTypes.TokenType.ACCESS),
         refreshToken: await this.getNewToken(payload, TokenTypes.TokenType.REFRESH),
      }
   }

   public async getNewToken(payload: TokenTypes.TokenPayload, tokenType: TokenTypes.TokenType): Promise<string> {
      if (!process.env.JWT_AUDIENCE_WEB || !process.env.JWT_AUDIENCE_MOBILE) {
         throw new ResError({ code: 1, message: "Missing token configuration" })
      }

      const secret = this.getSecreteKey(tokenType)
      const expiresIn = this.getExpiresIn(tokenType)
      const encryptionKey = this.encoder.encode(secret)

      return await new jose.SignJWT(payload)
         .setProtectedHeader({ alg: process.env.JWT_ALGORITHM || "HS256" })
         .setAudience([process.env.JWT_AUDIENCE_WEB, process.env.JWT_AUDIENCE_MOBILE])
         .setExpirationTime(expiresIn)
         .setIssuedAt()
         .sign(encryptionKey)
   }

   public async verifyToken(token: string, tokenType: TokenTypes.TokenType): Promise<boolean> {
      try {
         const encryptionKey = this.getEncryptionKey(tokenType)
         await jose.jwtVerify(token, encryptionKey)
         return true
      } catch (error) {
         throw this.getErrorInvaildToken(tokenType)
      }
   }

   public async decodeToken(token: string, tokenType: TokenTypes.TokenType): Promise<TokenTypes.TokenPayload> {
      try {
         const encryptionKey = this.getEncryptionKey(tokenType)
         const { payload } = await jose.jwtVerify(token, encryptionKey)
         return {
            userId: payload.userId as string,
            nickname: payload.nickname as string,
            profileUrl: payload.profileUrl as string,
         }
      } catch (error) {
         throw this.getErrorInvaildToken(tokenType)
      }
   }

   public async decodeTokenWithoutVerification(token: string, tokenType: TokenTypes.TokenType): Promise<TokenTypes.TokenPayload> {
      try {
         const payload = jose.decodeJwt(token)
         return {
            userId: payload.userId as string,
            nickname: payload.nickname as string,
            profileUrl: payload.profileUrl as string,
         }
      } catch (error) {
         throw this.getErrorInvaildToken(tokenType)
      }
   }

   private getSecreteKey(tokenType: TokenTypes.TokenType): string {
      if (tokenType == TokenTypes.TokenType.ACCESS) {
         return this.accessTokenSecret
      } else {
         return this.refreshTokenSecret
      }
   }

   private getExpiresIn(tokenType: TokenTypes.TokenType): string {
      if (tokenType == TokenTypes.TokenType.ACCESS) {
         return this.accessTokenExpiresIn
      } else {
         return this.refreshTokenExpiresIn
      }
   }

   private getEncryptionKey(tokenType: TokenTypes.TokenType): Uint8Array {
      if (tokenType === TokenTypes.TokenType.ACCESS) {
         return this.encoder.encode(this.accessTokenSecret)
      } else {
         return this.encoder.encode(this.refreshTokenSecret)
      }
   }

   private getErrorInvaildToken(tokenType: TokenTypes.TokenType): Error {
      if (tokenType === TokenTypes.TokenType.ACCESS) {
         return new ResError({ code: ResCode.INVAILD_ACCESS_TOKEN.code, message: ResCode.INVAILD_ACCESS_TOKEN.message })
      } else {
         return new ResError({ code: ResCode.INVAILD_REFRESH_TOKEN.code, message: ResCode.INVAILD_REFRESH_TOKEN.message })
      }
   }
}
