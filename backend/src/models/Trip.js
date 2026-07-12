const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Trip = sequelize.define('Trip', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  source: { type: DataTypes.STRING, allowNull: false },
  destination: { type: DataTypes.STRING, allowNull: false },
  vehicleId: { type: DataTypes.INTEGER, allowNull: false },
  driverId: { type: DataTypes.INTEGER, allowNull: false },
  managerId: { type: DataTypes.INTEGER, allowNull: true },
  cargoWeight: { type: DataTypes.FLOAT, allowNull: false },
  plannedDistance: { type: DataTypes.FLOAT, allowNull: false },
  actualDistance: { type: DataTypes.FLOAT, allowNull: true },
  fuelConsumed: { type: DataTypes.FLOAT, allowNull: true },
  revenue: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('Draft', 'Dispatched', 'Completed', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Draft',
  },
  dispatchedAt: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'trips', timestamps: true });

module.exports = Trip;
