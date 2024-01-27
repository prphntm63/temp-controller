'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class historical_data extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  historical_data.init({
    time: DataTypes.DATE,
    device_id: DataTypes.STRING,
    status: DataTypes.STRING,
    set_temp: DataTypes.NUMBER,
    current_temp: DataTypes.NUMBER,
    gravity: DataTypes.NUMBER
  }, {
    sequelize,
    modelName: 'historical_data',
  });
  return historical_data;
};