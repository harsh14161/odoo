const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FuelLog = sequelize.define('FuelLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  vehicleId: { type: DataTypes.INTEGER, allowNull: false },
  liters: { type: DataTypes.FLOAT, allowNull: false },
  cost: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  tripId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'fuel_logs', timestamps: true });

module.exports = FuelLog;
