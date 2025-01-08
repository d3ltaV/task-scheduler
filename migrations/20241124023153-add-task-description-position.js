'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'description', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
    await queryInterface.addColumn('tasks', 'position', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tasks', 'description');

    // Remove 'position' column
    await queryInterface.removeColumn('tasks', 'position');
  }
};
