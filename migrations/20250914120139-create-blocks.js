"use strict"

module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("Blocks", {
         blockId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
         },
         blockerUserId: {
            type: Sequelize.STRING(32),
            allowNull: false,
            comment: "차단을 한 사용자 ID",
         },
         blockedUserId: {
            type: Sequelize.STRING(32),
            allowNull: false,
            comment: "차단을 당한 사용자 ID",
         },
         reason: {
            type: Sequelize.ENUM("MANUAL", "BY_REPORT"),
            allowNull: true,
            comment: "차단 사유",
         },
         comment: {
            type: Sequelize.STRING,
            allowNull: true,
            comment: "차단 관련 메모 (관리자 또는 사용자)",
         },
         createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
         },
         updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
         },
         deletedAt: {
            allowNull: true,
            type: Sequelize.DATE,
         },
      })
   },

   async down(queryInterface, Sequelize) {
      await queryInterface.dropTable("Blocks")
   },
}
