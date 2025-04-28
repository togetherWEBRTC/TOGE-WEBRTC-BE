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
   })
   userId!: string

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
      allowNull: false,
   })
   password!: string

   @Column({
      type: DataType.STRING(1000),
      allowNull: false,
   })
   refreshToken!: string

   @CreatedAt
   createdAt!: Date

   @UpdatedAt
   updatedAt!: Date

   @DeletedAt
   deletedAt?: Date
}
