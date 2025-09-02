import { AccountDto } from "@models/dto.accounts"
import { AccountDAO, UserStatus } from "@models/dao.accounts"
import { UserInfo, SocialUserInfo } from "@type/user.info.type"

export interface IAccountRepository {
   createAccount(params: { userId: string; nickname: string; password: string; refreshToken: string }): Promise<UserInfo>
   createSocialAccount(params: { userId: string; nickname: string; email: string; socialId: string; socialType: string; refreshToken: string; termsAgreed: boolean; privacyAgreed: boolean }): Promise<UserInfo>
   updateAccount(uid: number, userId: string, updateData: Partial<Omit<AccountDAO, "uid" | "userId" | "createdAt" | "updatedAt">>): Promise<void>
   updateAccountInfo(userId: string, updateData: Partial<Omit<AccountDAO, "uid" | "userId" | "createdAt" | "updatedAt">>): Promise<boolean>
   findOneAccount(whereData: Partial<Omit<AccountDAO, "createdAt" | "updatedAt">>): Promise<AccountDto>
   findByNickname(nickname: string): Promise<AccountDAO | null>
   isAccountExists(whereData: Partial<Omit<AccountDAO, "createdAt" | "updatedAt">>): Promise<boolean>
   modifyProfileImage(userId: string): Promise<Boolean>
   deleteAccount(userId: string): Promise<boolean>
   deleteSocialAccount(userId: string): Promise<boolean>
   getGoogleToken(idToken: string): Promise<SocialUserInfo>
}
