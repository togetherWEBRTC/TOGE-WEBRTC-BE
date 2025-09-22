"use strict"

module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("Inquiries", {
         inquiryId: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: "문의 고유번호"
         },
         userId: {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: "문의자 사용자 ID (비회원인 경우 null)"
         },
         content: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: "문의 내용"
         },
         category: {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: "문의 카테고리"
         },
         status: {
            type: Sequelize.ENUM("PENDING", "IN_PROGRESS", "COMPLETED", "CLOSED"),
            allowNull: false,
            defaultValue: "PENDING",
            comment: "처리 상태"
         },
         responseContent: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: "답변 내용"
         },
         respondedAt: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: "답변 처리 일시"
         },
         createdAt: {
            allowNull: false,
            type: Sequelize.DATE
         },
         updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
         }
      })
   },

   async down(queryInterface, Sequelize) {
      await queryInterface.dropTable("Inquiries")
   }
}