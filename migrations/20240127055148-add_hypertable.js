
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SELECT create_hypertable('historical_data', by_range('time'));");
    await queryInterface.sequelize.query("SELECT add_retention_policy('historical_data', INTERVAL '30 days');");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('configs');
  }
};