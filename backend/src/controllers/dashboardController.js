const { Vehicle, Driver, Trip } = require('../models');
const { Op } = require('sequelize');

exports.kpis = async (req, res) => {
  try {
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
