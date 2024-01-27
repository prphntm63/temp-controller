'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('historical_data', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      time: {
        primaryKey: true,
        type: Sequelize.DATE
      },
      device_id: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      set_temp: {
        type: Sequelize.FLOAT
      },
      current_temp: {
        type: Sequelize.FLOAT
      },
      gravity: {
        type: Sequelize.FLOAT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('historical_data');
  }
};