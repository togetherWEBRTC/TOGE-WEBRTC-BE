"use strict"

module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("Reports", {
         reportId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
         },
         reporterUserId: {
            type: Sequelize.STRING(32),
            allowNull: false,
            comment: "신고자 ID",
         },
         reportedUserId: {
            type: Sequelize.STRING(32),
            allowNull: false,
            comment: "피신고자 ID",
         },
         reportTargetType: {
            type: Sequelize.ENUM("CALL_SESSION", "CHAT_MESSAGE", "USER_PROFILE"),
            allowNull: false,
            comment: "신고 대상의 종류",
         },
         reportTargetId: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: "신고 대상의 고유 ID (방번호 , 채팅, 프로필 등)",
         },
         reasonCategory: {
            type: Sequelize.STRING(50),
            allowNull: false,
            comment: "신고 사유",
         },
         reasonDetails: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: "상세 신고 사유",
         },
         status: {
            type: Sequelize.ENUM("PENDING", "REVIEWED", "REJECTED"),
            allowNull: false,
            defaultValue: "PENDING",
            comment: "신고 처리 상태",
         },
         createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
         },
         updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
         },
      })
   },

   async down(queryInterface, Sequelize) {
      await queryInterface.dropTable("Reports")
   },
}
