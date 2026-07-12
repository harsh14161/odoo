const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MaintenanceLog = sequelize.define('MaintenanceLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  vehicleId: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
  cost: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM('Active', 'Closed'),
    allowNull: false,
    defaultValue: 'Active',
  },
}, { tableName: 'maintenance_logs', timestamps: true });

module.exports = MaintenanceLog;
