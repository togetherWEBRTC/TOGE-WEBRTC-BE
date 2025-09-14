import { AccountDAO, UserStatus } from "@models/dao.accounts"
import { UserInfo, SocialUserInfo } from "@type/user.info.type"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import { ResError, ResCode } from "@type/response.types"
import { AccountDto } from "@models/dto.accounts"
import { WhereOptions } from "sequelize"
import sequelize from "@config/database"
import { IAccountRepository } from "@repositorys/account.i.repository"
import SocialGoogleDatasource from "@/network/social.google.datasource"

export class AccountRepository implements IAccountRepository {
   constructor(private readonly socialGoogleDatasource: SocialGoogleDatasource) {
      dotenv.config()
   }

   // create query
   public async createAccount({ userId, nickname, password, refreshToken }: { userId: string; nickname: string; password: string; refreshToken: string }): Promise<UserInfo> {
      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_NUM ?? "1", 1))
      const res = await AccountDAO.create({
         userId: userId,
         nickname: nickname,
         password: hashedPassword,
         userStatus: UserStatus.ACTIVE,
         profileUrl: this.getRandomProfileUrl(),
         refreshToken: refreshToken,
      } as any)

      const userInfo: UserInfo = {
         userId: res.dataValues.userId,
         name: res.dataValues.nickname,
         profileUrl: res.dataValues.profileUrl ?? "",
      }

      return userInfo
   }

   public async createSocialAccount({
      userId,
      nickname,
      email,
      socialId,
      socialType,
      refreshToken,
      profileUrl,
      termsAgreed,
      privacyAgreed,
   }: {
      userId: string
      nickname: string
      email: string
      socialId: string
      socialType: string
      refreshToken: string
      profileUrl: string
      termsAgreed: boolean
      privacyAgreed: boolean
   }): Promise<UserInfo> {
      const res = await AccountDAO.create({
         userId: userId,
         nickname: nickname,
         password: "nouse",
         email: email,
         socialId: socialId,
         socialType: socialType,
         userStatus: UserStatus.ACTIVE,
         profileUrl: profileUrl,
         refreshToken: refreshToken,
         termsAgreed: termsAgreed,
         privacyAgreed: privacyAgreed,
      } as any)

      const userInfo: UserInfo = {
         userId: res.dataValues.userId,
         name: res.dataValues.nickname,
         profileUrl: res.dataValues.profileUrl ?? "",
      }

      return userInfo
   }

   // update query
   public async updateAccount(uid: number, userId: string, updateData: Partial<Omit<AccountDAO, "uid" | "userId" | "createdAt" | "updatedAt">>) {
      await AccountDAO.update(updateData, {
         where: {
            uid: uid,
            userId: userId,
         },
      })
   }

   // update query
   public async updateAccountInfo(userId: string, updateData: Partial<Omit<AccountDAO, "uid" | "userId" | "createdAt" | "updatedAt">>): Promise<boolean> {
      const [affectedCount] = await AccountDAO.update(updateData, {
         where: {
            userId: userId,
         },
      })
      return affectedCount > 0
   }

   // findone query
   public async findOneAccount(whereData: Partial<Omit<AccountDAO, "createdAt" | "updatedAt">>): Promise<AccountDto> {
      const res = await AccountDAO.findOne({
         where: {
            ...whereData,
         } as WhereOptions<AccountDAO>,
      })
      return await this.mapToAccountDto(res)
   }

   async findByNickname(nickname: string) {
      return await AccountDAO.findOne({
         where: { nickname },
      })
   }

   // checke contains query
   public async isAccountExists(whereData: Partial<Omit<AccountDAO, "createdAt" | "updatedAt">>): Promise<boolean> {
      const res = await AccountDAO.findOne({
         where: {
            ...whereData,
         } as WhereOptions<AccountDAO>,
      })
      return res !== null
   }

   // modify profile image
   public async modifyProfileImage(userId: string): Promise<Boolean> {
      const profileUrl = this.getRandomProfileUrl()
      await AccountDAO.update({ profileUrl: profileUrl }, { where: { userId: userId } })
      return true
   }

   // withdraw
   public async deleteAccount(userId: string): Promise<boolean> {
      const deletedCount = await AccountDAO.destroy({
         where: { userId },
         force: true,
      })
      return deletedCount > 0
   }

   // social withdraw
   public async deleteSocialAccount(userId: string): Promise<boolean> {
      const account = await AccountDAO.findOne({
         where: { userId, userStatus: UserStatus.ACTIVE },
      })

      if (!account) {
         throw new ResError({ code: ResCode.USER_NOT_FOUND_OR_DELETED.code, message: ResCode.USER_NOT_FOUND_OR_DELETED.message })
      }

      const transaction = await sequelize.transaction()

      try {
         const deletionSuffix = `_deleted`
         await AccountDAO.update(
            {
               userStatus: UserStatus.WITHDRAWN,
               email: `${account.email}${deletionSuffix}`,
               socialId: `${account.socialId}${deletionSuffix}`,
               refreshToken: "",
            },
            {
               where: { userId: userId },
               transaction: transaction,
            }
         )

         const deletedCount = await AccountDAO.destroy({
            where: { userId: userId },
            transaction: transaction,
         })

         await transaction.commit()

         return deletedCount > 0
      } catch (error) {
         await transaction.rollback()
         throw new ResError({
            code: ResCode.FAIL_WITHDRAW_MEMBER.code,
            message: ResCode.FAIL_WITHDRAW_MEMBER.message + " : " + error,
         })
      }
   }

   //google login
   public async getGoogleToken(idToken: string): Promise<SocialUserInfo> {
      const socialUserInfo = await this.socialGoogleDatasource.verifyIdToken(idToken)
      return socialUserInfo
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

   /**
    *  AccountDAO -> AccountDto 변환
    * @param res 쿼리결과 | 실패시 null
    * @returns AccountDto | ResError
    */
   private async mapToAccountDto(res: AccountDAO | null): Promise<AccountDto> {
      if (!res) {
         throw new ResError({ code: ResCode.DATA_ERROR.code, message: ResCode.DATA_ERROR.message })
      }

      return {
         uid: res.dataValues.uid,
         userId: res.dataValues.userId,
         userStatus: res.dataValues.userStatus,
         nickname: res.dataValues.nickname,
         profileUrl: res.dataValues.profileUrl ?? "",
         password: res.dataValues.password,
         refreshToken: res.dataValues.refreshToken,
      }
   }

   /**
    *
    * @returns 랜덤 프로필 이미지 URL
    */
   private getRandomProfileUrl(): string {
      return "profile/" + (Math.floor(Math.random() * 58) + 1) + ".png"
   }
}
