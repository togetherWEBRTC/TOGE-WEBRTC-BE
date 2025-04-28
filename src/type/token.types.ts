export type TokenPair = {
   accessToken: string
   refreshToken: string
}

export type TokenPayload = {
   userId: string
   nickname: string
   profileUrl: string
}

export enum TokenType {
   ACCESS,
   REFRESH,
}
