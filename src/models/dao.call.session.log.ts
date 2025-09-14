import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from "sequelize-typescript"

export enum LogAction {
   JOIN = "JOIN", // 입장
   LEAVE = "LEAVE", // 퇴장
}

@Table({
   tableName: "CallSessionLogs",
   timestamps: true,
})
export class CallSessionLogDAO extends Model<CallSessionLogDAO> {
   @Column({
      type: DataType.BIGINT,
      autoIncrement: true,
      primaryKey: true,
   })
   logId!: number

   @Column({
      type: DataType.STRING(16),
      allowNull: false,
      comment: "통화 세션 ID",
   })
   callSessionId!: string

   @Column({
      type: DataType.STRING(32),
      allowNull: false,
      comment: "행동을 한 사용자 ID",
   })
   userId!: string

   @Column({
      type: DataType.ENUM("JOIN", "LEAVE"),
      allowNull: false,
      comment: "행동 종류 (입장/퇴장)",
   })
   action!: LogAction

   @CreatedAt
   createdAt!: Date

   @UpdatedAt
   updatedAt!: Date
}
