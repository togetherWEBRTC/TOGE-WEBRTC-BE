import { Response, Request } from "express"
import { ResCode, ResError, ResCookie, ResCookieOptions } from "@type/response.types"

export function successResponse<T>(res: Response, message: string = ResCode.SUCCESS.message, data?: T, cookies?: ResCookie[]): Response {
   if (cookies) {
      withCookies(res, cookies)
   }

   const response = res.status(200).json({
      code: ResCode.SUCCESS.code,
      message,
      ...(data && data),
   })
   return response
}

export function errorResponse(res: Response, errorCode: number, message: string, statusCode: number = 200, others?: any) {
   console.error("🛎️ ERROR OCCURRED!! errorCode:", errorCode)
   return res.status(statusCode).json({
      code: errorCode,
      message,
      ...(others && { others }),
   })
}

export function handleError(res: Response, error: any): void {
   console.error("🛎️ ERROR OCCURRED!! :", error)
   let statusCode = 200
   if (error instanceof ResError) {
      switch (error.code) {
         case ResCode.INVAILD_ACCESS_TOKEN.code:
            statusCode = 401 // Unauthorized
            break
         case ResCode.INVAILD_REFRESH_TOKEN.code:
            statusCode = 403 // Forbidden
            break
      }
      errorResponse(res, error.code, error.message, statusCode)
   } else {
      errorResponse(res, ResCode.SERVER_ERROR.code, ResCode.SERVER_ERROR.message, statusCode)
   }
}

function withCookies(res: Response, cookies: ResCookie[]): Response {
   cookies.forEach(({ name, value, options }) => {
      const cookieOptions = {
         secure: false,
         sameSite: "strict" as "strict" | "lax" | "none",
         path: "/",
         ...options,
      }
      res.cookie(name, value, cookieOptions)
   })
   return res
}
