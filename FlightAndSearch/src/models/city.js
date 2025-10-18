'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class City extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Relational logic there
      this.hasMany(models.Airport, {
        foreignKey: "cityId"
      })
    }
  }
  City.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,   // required: true
      unique: true,
    },
  }, {
    sequelize,
    modelName: 'City',
  });
  return City;
};