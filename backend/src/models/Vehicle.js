const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vehicle = sequelize.define('Vehicle', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  registrationNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  maxLoadCapacity: { type: DataTypes.FLOAT, allowNull: false },
  odometer: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  acquisitionCost: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  region: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM('Available', 'On Trip', 'In Shop', 'Retired'),
    allowNull: false,
    defaultValue: 'Available',
  },
}, { tableName: 'vehicles', timestamps: true });

module.exports = Vehicle;
