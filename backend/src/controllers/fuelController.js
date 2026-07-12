const { FuelLog, Vehicle } = require('../models');

exports.list = async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const where = {};
    if (vehicleId) where.vehicleId = vehicleId;
    const logs = await FuelLog.findAll({ where, include: [{ model: Vehicle, as: 'vehicle' }], order: [['id', 'DESC']] });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch fuel logs', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { vehicleId, liters, cost, date } = req.body;
    if (!vehicleId || liters == null || cost == null || !date) {
      return res.status(400).json({ message: 'vehicleId, liters, cost and date are required' });
    }
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    const log = await FuelLog.create({ vehicleId, liters, cost, date });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create fuel log', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const log = await FuelLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ message: 'Fuel log not found' });
    await log.destroy();
    res.json({ message: 'Fuel log deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete fuel log', error: err.message });
  }
};
