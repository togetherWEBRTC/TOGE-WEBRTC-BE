import { Table, Column, Model, DataType, CreatedAt, BeforeBulkUpdate, UpdatedAt, DeletedAt, BeforeCreate, BeforeBulkDestroy } from "sequelize-typescript"

export enum UserStatus {
   ACTIVE = "ACTIVE", // 정상
   WITHDRAWN = "WITHDRAWN", // 탈퇴
}

@Table({
   tableName: "Accounts",
   timestamps: true,
})
export class AccountDAO extends Model<AccountDAO> {
   @Column({
      type: DataType.INTEGER,
      autoIncrement: true,
      primaryKey: true,
   })
   uid!: number

   @Column({
      type: DataType.STRING(32),
      allowNull: false,
      unique: true,
      comment: "서비스 내부에서 사용하는 고유 식별자 ID",
   })
   userId!: string

   @Column({
      type: DataType.STRING(255),
      allowNull: true,
      comment: "소셜 제공자의 고유 ID",
   })
   socialId!: string

   @Column({
      type: DataType.STRING(10),
      allowNull: true,
      comment: "소셜 제공자 타입 : GOOGLE",
   })
   socialType!: string

   @Column({
      type: DataType.STRING(128),
      allowNull: true,
      unique: false,
   })
   email!: string

   @Column({
      type: DataType.ENUM("ACTIVE", "WITHDRAWN"),
      allowNull: false,
      defaultValue: "ACTIVE",
   })
   userStatus!: UserStatus

   @Column({
      type: DataType.STRING(64),
      allowNull: false,
      unique: false,
   })
   nickname!: string

   @Column({
      type: DataType.STRING(255),
      allowNull: true,
   })
   profileUrl!: string

   @Column({
      type: DataType.STRING,
      allowNull: true,
   })
   password!: string

   @Column({
      type: DataType.STRING(1000),
      allowNull: false,
   })
   refreshToken!: string

   @Column({
      type: DataType.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "이용약관 동의 여부",
   })
   termsAgreed!: boolean

   @Column({
      type: DataType.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "개인정보 처리방침 동의 여부",
   })
   privacyAgreed!: boolean

   @CreatedAt
   createdAt!: Date

   @UpdatedAt
   updatedAt!: Date

   @DeletedAt
   deletedAt?: Date
}
