import { OAuth2Client, TokenPayload } from "google-auth-library"
import { SocialUserInfo } from "@type/user.info.type"
import { ResError, ResCode } from "@type/response.types"

export default class SocialGoogleDatasource {
   private client: OAuth2Client

   constructor() {
      this.client = new OAuth2Client()
   }

   public async verifyIdToken(idToken: string): Promise<SocialUserInfo> {
      try {
         const audience = process.env.GOOGLE_WEB_ID
         if (!audience) {
            console.error("SocialGoogleDatasource : GOOGLE_WEB_ID is not set")
            throw new ResError({ code: ResCode.FAIL_SOCIAL_LOGIN_INVAILD_INFO.code, message: "WEB_ID is not set" })
         }

         const ticket = await this.client.verifyIdToken({
            idToken,
            audience,
         })

         const payload = ticket.getPayload()

         if (!payload || !payload.sub || !payload.email) {
            console.error("Invalid payload received from Google.", payload)
            throw new ResError({ code: ResCode.FAIL_SOCIAL_LOGIN_INVAILD_INFO.code, message: "Invalid payload received from Google." })
         }

         if (payload.email_verified !== true) {
            console.warn("Google token email is not verified:", payload.email)
         }

         const socialUserInfo: SocialUserInfo = {
            subId: payload.sub,
            email: payload.email,
            type: "GOOGLE",
         }

         return socialUserInfo
      } catch (error) {
         if (error instanceof Error) {
            throw new ResError({ code: ResCode.FAIL_SOCIAL_LOGIN_INVAILD_INFO.code, message: error.message })
         } else {
            throw new ResError({ code: ResCode.FAIL_SOCIAL_LOGIN_INVAILD_INFO.code, message: ResCode.FAIL_SOCIAL_LOGIN_INVAILD_INFO.message })
         }
      }
   }
}
