import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from "sequelize-typescript"

export enum ReportTargetType {
   CALL_SESSION = "CALL_SESSION", // 통화 세션
   CHAT_MESSAGE = "CHAT_MESSAGE", // 채팅 메시지
   USER_PROFILE = "USER_PROFILE", // 사용자 프로필
}

export enum ReportStatus {
   PENDING = "PENDING", // 처리 대기
   REVIEWED = "REVIEWED", // 처리 완료
   REJECTED = "REJECTED", // 신고 기각
}

@Table({
   tableName: "Reports",
   timestamps: true,
})
export class ReportDAO extends Model<ReportDAO> {
   @Column({
      type: DataType.BIGINT,
      autoIncrement: true,
      primaryKey: true,
   })
   reportId!: number

   @Column({
      type: DataType.STRING(32),
      allowNull: false,
      comment: "신고자 ID",
   })
   reporterUserId!: string

   @Column({
      type: DataType.STRING(32),
      allowNull: false,
      comment: "피신고자 ID",
   })
   reportedUserId!: string

   @Column({
      type: DataType.ENUM("CALL_SESSION", "CHAT_MESSAGE", "USER_PROFILE"),
      allowNull: false,
      comment: "신고 대상의 종류",
   })
   reportTargetType!: ReportTargetType

   @Column({
      type: DataType.STRING(255),
      allowNull: false,
      comment: "신고 대상의 고유 ID (방번호 , 채팅, 프로필 등)",
   })
   reportTargetId!: string

   @Column({
      type: DataType.STRING(50),
      allowNull: false,
      comment: "신고 사유",
   })
   reasonCategory!: string

   @Column({
      type: DataType.TEXT,
      allowNull: true,
      comment: "상세 신고 사유",
   })
   reasonDetails!: string

   @Column({
      type: DataType.ENUM("PENDING", "REVIEWED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING",
      comment: "신고 처리 상태",
   })
   status!: ReportStatus

   @CreatedAt
   createdAt!: Date

   @UpdatedAt
   updatedAt!: Date
}
