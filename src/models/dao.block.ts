import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, DeletedAt } from "sequelize-typescript"

export enum BlockReason {
   MANUAL = "MANUAL", // 사용자가 직접 차단
   BY_REPORT = "BY_REPORT", // 신고에 의해 자동 차단
}

@Table({
   tableName: "Blocks",
   timestamps: true,
})
export class BlockDAO extends Model<BlockDAO> {
   @Column({
      type: DataType.BIGINT,
      autoIncrement: true,
      primaryKey: true,
   })
   blockId!: number

   @Column({
      type: DataType.STRING(32),
      allowNull: false,
      comment: "차단을 한 사용자 ID",
   })
   blockerUserId!: string

   @Column({
      type: DataType.STRING(32),
      allowNull: false,
      comment: "차단을 당한 사용자 ID",
   })
   blockedUserId!: string

   @Column({
      type: DataType.ENUM("MANUAL", "BY_REPORT"),
      allowNull: true,
      comment: "차단 사유",
   })
   reason!: BlockReason

   @Column({
      type: DataType.STRING(255),
      allowNull: true,
      comment: "사용자의 차단 관련 메모",
   })
   comment!: string

   @CreatedAt
   createdAt!: Date

   @UpdatedAt
   updatedAt!: Date

   @DeletedAt
   deletedAt?: Date
}
