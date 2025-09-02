"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      // 💡 트랜잭션 관련 코드를 모두 제거합니다.
      try {
         await queryInterface.addColumn("Accounts", "socialId", {
            type: Sequelize.DataTypes.STRING(255),
            allowNull: true,
            comment: "소셜 제공자의 고유 ID",
         })

         await queryInterface.addColumn("Accounts", "socialType", {
            type: Sequelize.DataTypes.STRING(10),
            allowNull: true,
            comment: "소셜 제공자 타입 : GOOGLE",
         })

         await queryInterface.addColumn("Accounts", "email", {
            type: Sequelize.DataTypes.STRING(128),
            allowNull: true,
            unique: false,
         })

         await queryInterface.changeColumn("Accounts", "password", {
            type: Sequelize.DataTypes.STRING,
            allowNull: true,
         })
      } catch (err) {
         // 롤백 로직이 없으므로 에러를 그냥 던져서 마이그레이션을 중단시킵니다.
         throw err
      }
   },

   async down(queryInterface, Sequelize) {
      // 💡 down 함수에서도 트랜잭션을 제거합니다.
      try {
         await queryInterface.changeColumn("Accounts", "password", {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
         })

         await queryInterface.removeColumn("Accounts", "email")
         await queryInterface.removeColumn("Accounts", "socialType")
         await queryInterface.removeColumn("Accounts", "socialId")
      } catch (err) {
         throw err
      }
   },
}
