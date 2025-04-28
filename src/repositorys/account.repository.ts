import { AccountDAO, UserStatus } from "@models/dao.accounts"
import { UserInfo } from "@type/user.info.type"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import { ResError, ResCode } from "@type/response.types"
import { AccountDto } from "@models/dto.accounts"
import { WhereOptions } from "sequelize"
import { IAccountRepository } from "@repositorys/account.i.repository"

export class AccountRepository implements IAccountRepository {
   constructor() {
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

   // update query
   public async updateAccount(uid: number, userId: string, updateData: Partial<Omit<AccountDAO, "uid" | "userId" | "createdAt" | "updatedAt">>) {
      await AccountDAO.update(updateData, {
         where: {
            uid: uid,
            userId: userId,
         },
      })
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
      return "profile/" + (Math.floor(Math.random() * 151) + 1) + ".png"
   }
}
