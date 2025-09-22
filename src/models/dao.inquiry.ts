import { Table, Column, Model, DataType, AutoIncrement, PrimaryKey } from "sequelize-typescript"

export enum InquiryStatus {
   PENDING = "PENDING", // 대기중
   IN_PROGRESS = "IN_PROGRESS", // 처리중
   COMPLETED = "COMPLETED", // 완료
   CLOSED = "CLOSED", // 종료
}

@Table({
   tableName: "Inquiries",
   timestamps: true,
   paranoid: false,
   freezeTableName: true,
   underscored: false,
   engine: "InnoDB",
   charset: "utf8mb4",
   collate: "utf8mb4_general_ci",
   comment: "문의사항 테이블",
})
export class InquiryDAO extends Model<InquiryDAO> {
   @PrimaryKey
   @AutoIncrement
   @Column({
      type: DataType.INTEGER,
      allowNull: false,
      comment: "문의 고유번호",
   })
   inquiryId!: number

   @Column({
      type: DataType.STRING(50),
      allowNull: true,
      comment: "문의자 사용자 ID (비회원인 경우 null)",
   })
   userId?: string

   @Column({
      type: DataType.TEXT,
      allowNull: false,
      comment: "문의 내용",
   })
   content!: string

   @Column({
      type: DataType.STRING(50),
      allowNull: true,
      comment: "문의 카테고리",
   })
   category?: string

   @Column({
      type: DataType.ENUM(...Object.values(InquiryStatus)),
      allowNull: false,
      defaultValue: InquiryStatus.PENDING,
      comment: "처리 상태",
   })
   status!: InquiryStatus

   @Column({
      type: DataType.TEXT,
      allowNull: true,
      comment: "답변 내용",
   })
   responseContent?: string

   @Column({
      type: DataType.DATE,
      allowNull: true,
      comment: "답변 처리 일시",
   })
   respondedAt?: Date
}
