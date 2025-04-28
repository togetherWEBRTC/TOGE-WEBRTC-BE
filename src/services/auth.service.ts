import { TokenPair, TokenType } from "@type/token.types"
import { UserInfo } from "@type/user.info.type"
import { ResError, ResCode } from "@type/response.types"
import { JWTService } from "@services/token.service"
import bcrypt from "bcrypt"
import { IAccountRepository } from "@repositorys/account.i.repository"

export class AuthService {
   constructor(private readonly accountRepository: IAccountRepository, private readonly tokenService: JWTService) {}

   // 사용가능한 유저아이디인지 체크
   async isAvailableUsingUserId(userId: string): Promise<boolean> {
      const isExisted = await this.accountRepository.isAccountExists({ userId: userId })
      if (isExisted == true) {
         throw new ResError({ code: ResCode.DUPLICATED_ID.code, message: ResCode.DUPLICATED_ID.message })
      }
      return isExisted
   }

   /**
    *  1. db에 회원정보 저장
    *  2. 토큰 발급
    *  3. db에 토큰 업데이트
    *  return UserInfo
    */
   async signup(userId: string, nickname: string, password: string, passwordConfirm: string): Promise<UserInfo> {
      //TODO: 비밀번호 확인, 아이디 길이 확인, 비밀번호 길이 확인

      await this.isAvailableUsingUserId(userId)

      if (password !== passwordConfirm) {
         throw new ResError({ code: ResCode.PASSWORD_NOT_MATCH.code, message: ResCode.PASSWORD_NOT_MATCH.message })
      }

      const userinfo: UserInfo = await this.accountRepository.createAccount({
         userId: userId,
         nickname: nickname,
         password: password,
         refreshToken: "TOKEN",
      })
      return userinfo
   }

   /**
    * 1. 유저정보 조회
    * 2. 패스워드 비교
    * 3. 토큰 발급
    * 4. db에 토큰 업데이트
    * return TokenPair
    */
   async login(userId: string, password: string): Promise<[UserInfo, TokenPair]> {
      try {
         const accountDto = await this.accountRepository.findOneAccount({ userId: userId })
         await this.comparePassword(password, accountDto.password)
         const tokenPair = await this.tokenService.getTokenPair({
            userId: accountDto.userId,
            nickname: accountDto.nickname,
            profileUrl: accountDto.profileUrl,
         })
         await this.accountRepository.updateAccount(accountDto.uid, accountDto.userId, {
            refreshToken: tokenPair.refreshToken,
         })
         const userInfo = {
            userId: accountDto.userId,
            name: accountDto.nickname,
            profileUrl: accountDto.profileUrl,
         }
         return [userInfo, tokenPair]
      } catch (e) {
         throw new ResError({ code: ResCode.FAILED_LOGIN.code, message: ResCode.FAILED_LOGIN.message })
      }
   }

   /**
    * 1. refreshToken 검사 및 decode
    * 2. db에 refreshToken 검사
    * 3. 새로운 accessToken 발급
    *
    * @param refreshToken
    * @returns access token
    */
   async getAccessToken(refreshToken: string): Promise<String> {
      try {
         const tokenPayload = await this.tokenService.decodeToken(refreshToken, TokenType.REFRESH)
         console.log("tokenPayload  ⭐️: ", tokenPayload)

         const accountDto = await this.accountRepository.findOneAccount({
            userId: tokenPayload.userId,
            refreshToken: refreshToken,
         })
         console.log("accountDto  ⭐️: ", accountDto)

         const accessToken = await this.tokenService.getNewToken(tokenPayload, TokenType.ACCESS)
         console.log("accessToken  ⭐️: ", accessToken)

         return accessToken
      } catch (e) {
         throw new ResError({ code: ResCode.INVAILD_REFRESH_TOKEN.code, message: ResCode.INVAILD_REFRESH_TOKEN.message })
      }
   }

   async getUserInfo(userId: string): Promise<UserInfo> {
      try {
         const accountDto = await this.accountRepository.findOneAccount({ userId: userId })
         return {
            userId: accountDto.userId,
            name: accountDto.nickname,
            profileUrl: accountDto.profileUrl,
         }
      } catch (e) {
         throw new ResError({ code: ResCode.DATA_ERROR.code, message: ResCode.DATA_ERROR.message })
      }
   }

   // 프로필 이미지 수정
   async modifyProfileImage(userId: string): Promise<boolean> {
      try {
         await this.accountRepository.modifyProfileImage(userId)
         return true
      } catch (e) {
         console.error("modifyProfileImage error: ", e)
         throw new ResError({ code: ResCode.DATA_ERROR.code, message: ResCode.DATA_ERROR.message })
      }
   }

   /**
    * 동일한 패스워드 검사
    * @param givenPassword 주어진 패스워드
    * @param hashedPassword 해싱된 패스워드
    * @returns true or ResError
    */
   private async comparePassword(givenPassword: string, hashedPassword: string): Promise<boolean> {
      const isPasswordMatch = await bcrypt.compare(givenPassword, hashedPassword)
      if (!isPasswordMatch) {
         throw new ResError({ code: ResCode.FAILED_LOGIN.code, message: ResCode.FAILED_LOGIN.message })
      }
      return isPasswordMatch
   }
}
