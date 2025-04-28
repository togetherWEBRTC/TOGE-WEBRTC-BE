import { Response, Request } from "express"
import { ResCode, ResError, ResCookie, ResCookieOptions } from "@type/response.types"
import { durationToMs } from "@utils/time.uitl"
import dotenv from "dotenv"

export async function getRefreshTokenCookie(req: Request, refreshToken: string, maxAgeSeconds: number = durationToMs(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN as string)): Promise<ResCookie> {
   dotenv.config()
   const cookieOptions: ResCookieOptions = {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/",
      domain: process.env.FRONT_URL,
      maxAge: maxAgeSeconds,
   }

   return {
      name: "refreshToken",
      value: refreshToken,
      options: cookieOptions,
   }
}
