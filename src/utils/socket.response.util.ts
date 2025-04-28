import { ResCode, ResError, ResCookie, ResCookieOptions, SocketResponse } from "@/type/response.types"

export function successSocketResponse<T extends object>(data?: T): SocketResponse {
   return {
      code: 0,
      message: ResCode.SUCCESS.message,
      ...(data || {}),
   }
}

export function errorSocketResponse(code: number = ResCode.SERVER_ERROR.code, message: string = ResCode.SERVER_ERROR.message): SocketResponse {
   return { code, message }
}

export function handleSocketError(error: unknown): SocketResponse {
   console.error("🛎️ SOCKET ERROR OCCURRED!!", error)
   if (error instanceof ResError) {
      return errorSocketResponse(error.code, error.message)
   } else {
      return errorSocketResponse(ResCode.SERVER_ERROR.code, (error as Error).message)
   }
}
