
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query("SELECT create_hypertable('historical_data', by_range('time'));");
  },

  down: (queryInterface, Sequelize) => {
  }
};