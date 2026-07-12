const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Driver = sequelize.define('Driver', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  licenseNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  licenseCategory: { type: DataTypes.STRING, allowNull: false },
  licenseExpiry: { type: DataTypes.DATEONLY, allowNull: false },
  contactNumber: { type: DataTypes.STRING, allowNull: true },
  safetyScore: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 100 },
  status: {
    type: DataTypes.ENUM('Available', 'On Trip', 'Off Duty', 'Suspended'),
    allowNull: false,
    defaultValue: 'Available',
  },
}, { tableName: 'drivers', timestamps: true });

module.exports = Driver;
