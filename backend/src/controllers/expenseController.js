const { Expense, Vehicle } = require('../models');

exports.list = async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const where = {};
    if (vehicleId) where.vehicleId = vehicleId;
    const expenses = await Expense.findAll({ where, include: [{ model: Vehicle, as: 'vehicle' }], order: [['id', 'DESC']] });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch expenses', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { vehicleId, type, amount, date, notes } = req.body;
    if (!vehicleId || !type || amount == null || !date) {
      return res.status(400).json({ message: 'vehicleId, type, amount and date are required' });
    }
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    const expense = await Expense.create({ vehicleId, type, amount, date, notes });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create expense', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    await expense.destroy();
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete expense', error: err.message });
  }
};
