import { TokenPayload } from "@type/token.types"
import { Request } from "express"

export {}

declare module "express-serve-static-core" {
   interface Request {
      tokenPayload?: TokenPayload
      refreshToken?: string
      accessToken?: string
   }
}
