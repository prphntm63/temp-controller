'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('configs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      device_id: {
        primaryKey: true,
        unique: true,
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.TEXT
      },
      set_temp: {
        type: Sequelize.FLOAT
      },
      threshold: {
        type: Sequelize.FLOAT
      },
      og: {
        type: Sequelize.FLOAT
      },
      fg: {
        type: Sequelize.FLOAT
      },
      name: {
        type: Sequelize.TEXT
      },
      url: {
        type: Sequelize.TEXT
      },
      tare: {
        type: Sequelize.FLOAT
      },
      full: {
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

    await queryInterface.bulkInsert('configs', [
      {
        device_id: "ferm1",
        name: "Fermenter 1",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        device_id: "ferm2",
        name: "Fermenter 2",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        device_id: "chiller",
        name: "Chiller",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        device_id: "ambient",
        name: "Ambient",
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ])
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('configs');
  }
};