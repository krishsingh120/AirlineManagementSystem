'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    await queryInterface.bulkInsert("airports", [
      {
        name: "bareilly Airport",
        cityId: 86,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Indira Gandhi International Airport",
        cityId: 98,
        createdAt: new Date(),
        updatedAt: new Date(),

      },
      {
        name: "Hindon Airport",
        cityId: 98,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Dr. Babasaheb Ambedkar International Airport",
        cityId: 99,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
