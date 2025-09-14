import { TokenPair, TokenType, TokenPayload } from "@type/token.types"
import { UserInfo, SocialType, SocialUserInfo } from "@type/user.info.type"
import { ResError, ResCode } from "@type/response.types"
import { JWTService } from "@services/token.service"
import bcrypt from "bcrypt"
import { IAccountRepository } from "@repositorys/account.i.repository"
import { getRandomStringLength, getRandomNickname } from "@utils/string.util"
import { AccountDto } from "@models/dto.accounts"
import { AccountDAO } from "@/models/dao.accounts"

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

   public async socialLogin(token: string, type: SocialType): Promise<[UserInfo, TokenPair]> {
      const socialUserInfo = await this.accountRepository.getGoogleToken(token)

      const accountExists = await this.accountRepository.isAccountExists({ socialId: socialUserInfo.subId })
      if (accountExists) {
         // 이미 가입된 유저 -> 로그인 처리
         const account = await this.accountRepository.findOneAccount({ socialId: socialUserInfo.subId })
         return this.handleLogin(account)
      } else {
         // 신규유저 약관필요 - 토큰하고 같이 클라로 다시 전달
         const socialToken = await this.tokenService.getSocialToken({ subId: socialUserInfo.subId, email: socialUserInfo.email, type: SocialType[type] }, TokenType.ACCESS)
         throw new ResError({
            code: ResCode.NEED_TO_ADDITIONAL_TERMS.code,
            message: ResCode.NEED_TO_ADDITIONAL_TERMS.message,
            data: socialToken,
         })
      }
   }

   /**
    * 기존 유저의 로그인 처리를
    * @param account - DB에서 조회한 기존 유저의 DTO
    * @returns [UserInfo, TokenPair]
    */
   private async handleLogin(account: AccountDto): Promise<[UserInfo, TokenPair]> {
      const tokenPair = await this.tokenService.getTokenPair({
         userId: account.userId,
         nickname: account.nickname,
         profileUrl: account.profileUrl,
      })

      await this.accountRepository.updateAccount(account.uid, account.userId, {
         refreshToken: tokenPair.refreshToken,
      })

      const userInfo: UserInfo = {
         userId: account.userId,
         name: account.nickname,
         profileUrl: account.profileUrl,
      }

      return [userInfo, tokenPair]
   }

   public async socialSignUp(token: string, nickname: string, isAgreedTerms: boolean, isAgreedPrivacy: boolean): Promise<[UserInfo, TokenPair]> {
      //토큰검증
      //정보반환
      const socialUserInfo = await this.tokenService.decodeSocialToken(token, TokenType.ACCESS)

      // 유저아이디 생성(소셜아이디아님)
      let userId: string
      do {
         userId = await getRandomStringLength(10)
      } while (await this.accountRepository.isAccountExists({ userId }))

      const profileUrl = `profile/${Math.floor(Math.random() * 58) + 1}.png`

      const tokenPair = await this.tokenService.getTokenPair({
         userId: userId,
         nickname: nickname,
         profileUrl: profileUrl,
      })

      const newUserInfo = await this.accountRepository.createSocialAccount({
         userId: userId,
         nickname: nickname,
         email: socialUserInfo.email,
         socialId: socialUserInfo.subId,
         socialType: socialUserInfo.type,
         refreshToken: tokenPair.refreshToken,
         profileUrl: profileUrl,
         termsAgreed: isAgreedTerms,
         privacyAgreed: isAgreedPrivacy,
      })

      return [newUserInfo, tokenPair]
   }

   public async updateNickname(userId: string, newNickname: string): Promise<boolean> {
      const isSuccess = await this.accountRepository.updateAccountInfo(userId, { nickname: newNickname })

      if (!isSuccess) {
         throw new ResError({ code: ResCode.FAIL_MODIFY_NICKNAME.code, message: ResCode.FAIL_MODIFY_NICKNAME.message })
      }

      return true
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

         const newTokenPayload = {
            userId: accountDto.userId,
            nickname: accountDto.nickname,
            profileUrl: accountDto.profileUrl,
         } as TokenPayload

         const accessToken = await this.tokenService.getNewToken(newTokenPayload, TokenType.ACCESS)

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

   // 회원 탈퇴
   async withdraw(userId: string): Promise<boolean> {
      const isDeleted = await this.accountRepository.deleteAccount(userId)
      if (!isDeleted) {
         throw new ResError({ code: ResCode.USER_NOT_FOUND_OR_DELETED.code, message: ResCode.USER_NOT_FOUND_OR_DELETED.message })
      }
      return true
   }

   // 소셜 회원탈퇴
   async deleteSocialWithdraw(userId: string): Promise<boolean> {
      const isDeleted = await this.accountRepository.deleteSocialAccount(userId)
      if (!isDeleted) {
         throw new ResError({ code: ResCode.USER_NOT_FOUND_OR_DELETED.code, message: ResCode.USER_NOT_FOUND_OR_DELETED.message })
      }
      return true
   }

   // 구글스토어 웹 소셜탈퇴
   public async webSocialWithdraw(token: string): Promise<boolean> {
      const socialUserInfo = await this.accountRepository.getGoogleToken(token)
      const accountExists = await this.accountRepository.isAccountExists({ socialId: socialUserInfo.subId })
      // 회원탈퇴
      if (accountExists) {
         const account = await this.accountRepository.findOneAccount({ socialId: socialUserInfo.subId })

         const isDeleted = await this.accountRepository.deleteSocialAccount(account.userId)

         if (isDeleted) {
            return true
         }
         return false
      } else {
         return false
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
