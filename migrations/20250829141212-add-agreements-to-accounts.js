"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.addColumn("Accounts", "termsAgreed", {
         type: Sequelize.DataTypes.BOOLEAN,
         allowNull: false,
         defaultValue: false,
         comment: "이용약관 동의 여부",
      })

      await queryInterface.addColumn("Accounts", "privacyAgreed", {
         type: Sequelize.DataTypes.BOOLEAN,
         allowNull: false,
         defaultValue: false,
         comment: "개인정보 처리방침 동의 여부",
      })
   },

   async down(queryInterface, Sequelize) {
      await queryInterface.removeColumn("Accounts", "termsAgreed")
      await queryInterface.removeColumn("Accounts", "privacyAgreed")
   },
}
