const sequelize = require('../config/db');
const User = require('./User');
const Vehicle = require('./Vehicle');
const Driver = require('./Driver');
const Trip = require('./Trip');
const MaintenanceLog = require('./MaintenanceLog');
const FuelLog = require('./FuelLog');
const Expense = require('./Expense');

// Associations
Vehicle.hasMany(Trip, { foreignKey: 'vehicleId', as: 'trips' });
Trip.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

Driver.hasMany(Trip, { foreignKey: 'driverId', as: 'trips' });
Trip.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

Vehicle.hasMany(MaintenanceLog, { foreignKey: 'vehicleId', as: 'maintenanceLogs' });
MaintenanceLog.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

Vehicle.hasMany(FuelLog, { foreignKey: 'vehicleId', as: 'fuelLogs' });
FuelLog.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

Vehicle.hasMany(Expense, { foreignKey: 'vehicleId', as: 'expenses' });
Expense.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

module.exports = {
  sequelize,
  User,
  Vehicle,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
};
