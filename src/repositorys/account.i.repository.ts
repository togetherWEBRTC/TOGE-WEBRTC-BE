import { AccountDto } from "@models/dto.accounts"
import { AccountDAO, UserStatus } from "@models/dao.accounts"
import { UserInfo } from "@type/user.info.type"

export interface IAccountRepository {
   createAccount(params: { userId: string; nickname: string; password: string; refreshToken: string }): Promise<UserInfo>
   updateAccount(uid: number, userId: string, updateData: Partial<Omit<AccountDAO, "uid" | "userId" | "createdAt" | "updatedAt">>): Promise<void>
   findOneAccount(whereData: Partial<Omit<AccountDAO, "createdAt" | "updatedAt">>): Promise<AccountDto>
   findByNickname(nickname: string): Promise<AccountDAO | null>
   isAccountExists(whereData: Partial<Omit<AccountDAO, "createdAt" | "updatedAt">>): Promise<boolean>
   modifyProfileImage(userId: string): Promise<Boolean>
}
