"use strict"

module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("CallSessionLogs", {
         logId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
         },
         callSessionId: {
            type: Sequelize.STRING(16),
            allowNull: false,
            comment: "통화 세션 ID",
         },
         userId: {
            type: Sequelize.STRING(32),
            allowNull: false,
            comment: "행동을 한 사용자 ID",
         },
         action: {
            type: Sequelize.ENUM("JOIN", "LEAVE"),
            allowNull: false,
            comment: "행동 종류 (입장/퇴장)",
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
      await queryInterface.dropTable("CallSessionLogs")
   },
}
