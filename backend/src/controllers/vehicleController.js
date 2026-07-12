const { Vehicle, Trip } = require('../models');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
  try {
    const { type, status, region } = req.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (region) where.region = region;
    const vehicles = await Vehicle.findAll({ where, order: [['id', 'ASC']] });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch vehicles', error: err.message });
  }
};

// Only vehicles eligible for dispatch (Available status)
exports.availableForDispatch = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({ where: { status: 'Available' }, order: [['id', 'ASC']] });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch vehicles', error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trips' }],
    });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch vehicle', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { registrationNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, region, status } = req.body;
    if (!registrationNumber || !name || !type || !maxLoadCapacity) {
      return res.status(400).json({ message: 'registrationNumber, name, type and maxLoadCapacity are required' });
    }
    const existing = await Vehicle.findOne({ where: { registrationNumber } });
    if (existing) return res.status(409).json({ message: 'Registration number must be unique' });

    const vehicle = await Vehicle.create({
      registrationNumber, name, type, maxLoadCapacity,
      odometer: odometer || 0, acquisitionCost: acquisitionCost || 0,
      region, status: status || 'Available',
    });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create vehicle', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (req.body.registrationNumber && req.body.registrationNumber !== vehicle.registrationNumber) {
      const existing = await Vehicle.findOne({ where: { registrationNumber: req.body.registrationNumber } });
      if (existing) return res.status(409).json({ message: 'Registration number must be unique' });
    }
    // Prevent manually setting a vehicle to On Trip / bypassing workflow accidentally
    await vehicle.update(req.body);
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update vehicle', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    const activeTrips = await Trip.count({ where: { vehicleId: vehicle.id, status: { [Op.in]: ['Draft', 'Dispatched'] } } });
    if (activeTrips > 0) {
      return res.status(400).json({ message: 'Cannot delete vehicle with active or draft trips' });
    }
    await vehicle.destroy();
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete vehicle', error: err.message });
  }
};
