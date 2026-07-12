const { Trip, Vehicle, Driver, FuelLog } = require('../models');
const { sequelize } = require('../models');

exports.list = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const trips = await Trip.findAll({
      where,
      include: [{ model: Vehicle, as: 'vehicle' }, { model: Driver, as: 'driver' }],
      order: [['id', 'DESC']],
    });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trips', error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id, {
      include: [{ model: Vehicle, as: 'vehicle' }, { model: Driver, as: 'driver' }],
    });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trip', error: err.message });
  }
};

// Create a trip in Draft status. Basic validation only (capacity check).
exports.create = async (req, res) => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance, revenue } = req.body;
    if (!source || !destination || !vehicleId || !driverId || cargoWeight == null || plannedDistance == null) {
      return res.status(400).json({ message: 'source, destination, vehicleId, driverId, cargoWeight and plannedDistance are required' });
    }

    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    const driver = await Driver.findByPk(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    if (cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({ message: `Cargo weight (${cargoWeight} kg) exceeds vehicle's max load capacity (${vehicle.maxLoadCapacity} kg)` });
    }

    const trip = await Trip.create({
      source, destination, vehicleId, driverId, cargoWeight, plannedDistance,
      revenue: revenue || 0, status: 'Draft',
    });
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create trip', error: err.message });
  }
};

// Dispatch: revalidate everything, then lock vehicle+driver as On Trip
exports.dispatch = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const trip = await Trip.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!trip) { await t.rollback(); return res.status(404).json({ message: 'Trip not found' }); }
    if (trip.status !== 'Draft') {
      await t.rollback();
      return res.status(400).json({ message: `Only Draft trips can be dispatched (current status: ${trip.status})` });
    }

    const vehicle = await Vehicle.findByPk(trip.vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
    const driver = await Driver.findByPk(trip.driverId, { transaction: t, lock: t.LOCK.UPDATE });

    if (!vehicle || vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
      await t.rollback();
      return res.status(400).json({ message: 'Vehicle is Retired or In Shop and cannot be dispatched' });
    }
    if (vehicle.status === 'On Trip') {
      await t.rollback();
      return res.status(400).json({ message: 'Vehicle is already On Trip' });
    }
    if (vehicle.status !== 'Available') {
      await t.rollback();
      return res.status(400).json({ message: 'Vehicle is not Available' });
    }

    if (!driver || driver.status === 'Suspended') {
      await t.rollback();
      return res.status(400).json({ message: 'Driver is Suspended and cannot be assigned' });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (driver.licenseExpiry < today) {
      await t.rollback();
      return res.status(400).json({ message: 'Driver license has expired' });
    }
    if (driver.status === 'On Trip') {
      await t.rollback();
      return res.status(400).json({ message: 'Driver is already On Trip' });
    }
    if (driver.status !== 'Available') {
      await t.rollback();
      return res.status(400).json({ message: 'Driver is not Available' });
    }

    if (trip.cargoWeight > vehicle.maxLoadCapacity) {
      await t.rollback();
      return res.status(400).json({ message: 'Cargo weight exceeds vehicle max load capacity' });
    }

    await vehicle.update({ status: 'On Trip' }, { transaction: t });
    await driver.update({ status: 'On Trip' }, { transaction: t });
    await trip.update({ status: 'Dispatched', dispatchedAt: new Date() }, { transaction: t });

    await t.commit();
    res.json(trip);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Failed to dispatch trip', error: err.message });
  }
};

// Complete: requires final odometer + fuel consumed. Restores vehicle+driver to Available.
exports.complete = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { finalOdometer, fuelConsumed, fuelCost } = req.body;
    const trip = await Trip.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!trip) { await t.rollback(); return res.status(404).json({ message: 'Trip not found' }); }
    if (trip.status !== 'Dispatched') {
      await t.rollback();
      return res.status(400).json({ message: `Only Dispatched trips can be completed (current status: ${trip.status})` });
    }
    if (finalOdometer == null || fuelConsumed == null) {
      await t.rollback();
      return res.status(400).json({ message: 'finalOdometer and fuelConsumed are required to complete a trip' });
    }

    const vehicle = await Vehicle.findByPk(trip.vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
    const driver = await Driver.findByPk(trip.driverId, { transaction: t, lock: t.LOCK.UPDATE });

    const actualDistance = Math.max(0, finalOdometer - vehicle.odometer);

    await vehicle.update({ status: 'Available', odometer: finalOdometer }, { transaction: t });
    await driver.update({ status: 'Available' }, { transaction: t });
    await trip.update({
      status: 'Completed', actualDistance, fuelConsumed, completedAt: new Date(),
    }, { transaction: t });

    if (fuelConsumed > 0) {
      await FuelLog.create({
        vehicleId: vehicle.id, liters: fuelConsumed, cost: fuelCost || 0,
        date: new Date().toISOString().slice(0, 10), tripId: trip.id,
      }, { transaction: t });
    }

    await t.commit();
    res.json(trip);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Failed to complete trip', error: err.message });
  }
};

// Cancel: Draft trips just get cancelled; Dispatched trips restore vehicle+driver to Available.
exports.cancel = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const trip = await Trip.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!trip) { await t.rollback(); return res.status(404).json({ message: 'Trip not found' }); }
    if (!['Draft', 'Dispatched'].includes(trip.status)) {
      await t.rollback();
      return res.status(400).json({ message: `Cannot cancel a trip with status ${trip.status}` });
    }

    if (trip.status === 'Dispatched') {
      const vehicle = await Vehicle.findByPk(trip.vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
      const driver = await Driver.findByPk(trip.driverId, { transaction: t, lock: t.LOCK.UPDATE });
      if (vehicle && vehicle.status === 'On Trip') await vehicle.update({ status: 'Available' }, { transaction: t });
      if (driver && driver.status === 'On Trip') await driver.update({ status: 'Available' }, { transaction: t });
    }

    await trip.update({ status: 'Cancelled' }, { transaction: t });
    await t.commit();
    res.json(trip);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Failed to cancel trip', error: err.message });
  }
};
