const { Vehicle, Driver, Trip, FuelLog, Expense } = require('../models');
const { Op } = require('sequelize');

exports.kpis = async (req, res) => {
  try {
    const role = req.user?.role || 'fleet_manager';

    if (role === 'driver') {
      // Driver-specific KPIs
      const driver = await Driver.findOne({ where: { name: req.user.name } });
      if (!driver) {
        return res.json({
          role,
          safetyScore: 100,
          licenseExpiry: 'N/A',
          status: 'N/A',
          activeTrips: 0,
          completedTrips: 0,
          totalTrips: 0
        });
      }

      const activeTrips = await Trip.count({ where: { driverId: driver.id, status: 'Dispatched' } });
      const completedTrips = await Trip.count({ where: { driverId: driver.id, status: 'Completed' } });
      const totalTrips = await Trip.count({ where: { driverId: driver.id } });

      return res.json({
        role,
        driverName: driver.name,
        safetyScore: driver.safetyScore,
        licenseExpiry: driver.licenseExpiry,
        status: driver.status,
        activeTrips,
        completedTrips,
        totalTrips
      });
    }

    if (role === 'safety_officer') {
      // Safety Officer-specific KPIs
      const totalDrivers = await Driver.count();
      const availableDrivers = await Driver.count({ where: { status: 'Available' } });
      const onTripDrivers = await Driver.count({ where: { status: 'On Trip' } });
      const suspendedDrivers = await Driver.count({ where: { status: 'Suspended' } });
      
      // Expiring in next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringLicenses = await Driver.count({
        where: {
          licenseExpiry: {
            [Op.lte]: thirtyDaysFromNow.toISOString().slice(0, 10)
          }
        }
      });

      const lowScoreDrivers = await Driver.count({
        where: {
          safetyScore: {
            [Op.lt]: 90
          }
        }
      });

      return res.json({
        role,
        totalDrivers,
        availableDrivers,
        onTripDrivers,
        suspendedDrivers,
        expiringLicenses,
        lowScoreDrivers
      });
    }

    if (role === 'financial_analyst') {
      // Financial Analyst-specific KPIs
      const totalRevenue = (await Trip.sum('revenue', { where: { status: 'Completed' } })) || 0;
      const totalFuelCost = (await FuelLog.sum('cost')) || 0;
      const totalOtherExpenses = (await Expense.sum('amount')) || 0;
      const totalExpenses = totalFuelCost + totalOtherExpenses;
      const netProfit = totalRevenue - totalExpenses;

      const completedTrips = await Trip.count({ where: { status: 'Completed' } });
      const activeTrips = await Trip.count({ where: { status: 'Dispatched' } });

      return res.json({
        role,
        totalRevenue,
        totalFuelCost,
        totalOtherExpenses,
        totalExpenses,
        netProfit,
        completedTrips,
        activeTrips
      });
    }

    // Default/Admin/Fleet Manager KPIs
    const { type, status, region } = req.query;
    const vehicleWhere = {};
    if (type) vehicleWhere.type = type;
    if (region) vehicleWhere.region = region;
    if (status) vehicleWhere.status = status;

    const totalVehicles = await Vehicle.count({ where: vehicleWhere });
    const activeVehicles = await Vehicle.count({ where: { ...vehicleWhere, status: { [Op.ne]: 'Retired' } } });
    const availableVehicles = await Vehicle.count({ where: { ...vehicleWhere, status: 'Available' } });
    const vehiclesInMaintenance = await Vehicle.count({ where: { ...vehicleWhere, status: 'In Shop' } });
    const vehiclesOnTrip = await Vehicle.count({ where: { ...vehicleWhere, status: 'On Trip' } });

    const activeTrips = await Trip.count({ where: { status: 'Dispatched' } });
    const pendingTrips = await Trip.count({ where: { status: 'Draft' } });
    const driversOnDuty = await Driver.count({ where: { status: 'On Trip' } });

    const fleetUtilization = activeVehicles > 0 ? Number(((vehiclesOnTrip / activeVehicles) * 100).toFixed(2)) : 0;

    res.json({
      role,
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      totalVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute KPIs', error: err.message });
  }
};
